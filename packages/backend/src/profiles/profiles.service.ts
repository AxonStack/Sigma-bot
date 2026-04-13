import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export type UserProfile = {
  address: string;
  name: string;
  points: number;
  createdAt: string;
  updatedAt: string;
};

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const NAME_PATTERN = /^[A-Za-z0-9 _-]+$/;

@Injectable()
export class ProfilesService {
  private readonly logger = new Logger(ProfilesService.name);
  private readonly backendRoot = this.resolveBackendRoot();
  private readonly sourceFilePath = path.join(this.backendRoot, 'profiles.json');
  private readonly jsonFilePath = this.resolveWritableFilePath();

  getAllProfiles(): UserProfile[] {
    return this.readProfiles().sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return a.name.localeCompare(b.name);
    });
  }

  getProfile(address: string): UserProfile | null {
    const normalizedAddress = this.normalizeAddress(address);
    return this.readProfiles().find((profile) => profile.address === normalizedAddress) ?? null;
  }

  upsertProfile(address: string, name: string): UserProfile {
    const normalizedAddress = this.normalizeAddress(address);
    const normalizedName = this.normalizeName(name);
    const now = new Date().toISOString();
    const profiles = this.readProfiles();
    const existingIndex = profiles.findIndex((profile) => profile.address === normalizedAddress);

    const nextProfile: UserProfile = {
      address: normalizedAddress,
      name: normalizedName,
      points: existingIndex >= 0 ? profiles[existingIndex].points : 0,
      createdAt: existingIndex >= 0 ? profiles[existingIndex].createdAt : now,
      updatedAt: now,
    };

    if (existingIndex >= 0) {
      profiles[existingIndex] = nextProfile;
    } else {
      profiles.push(nextProfile);
    }

    this.writeProfiles(profiles);
    return nextProfile;
  }

  private normalizeAddress(address: string): string {
    const normalizedAddress = (address ?? '').trim();
    if (!ADDRESS_PATTERN.test(normalizedAddress)) {
      throw new BadRequestException('A valid EVM wallet address is required.');
    }
    return normalizedAddress.toLowerCase();
  }

  private normalizeName(name: string): string {
    const normalizedName = (name ?? '').trim();

    if (normalizedName.length < 2 || normalizedName.length > 24) {
      throw new BadRequestException('Name must be between 2 and 24 characters.');
    }

    if (!NAME_PATTERN.test(normalizedName)) {
      throw new BadRequestException('Name can only contain letters, numbers, spaces, underscores, and hyphens.');
    }

    return normalizedName;
  }

  private ensureFile() {
    fs.mkdirSync(path.dirname(this.jsonFilePath), { recursive: true });
    if (!fs.existsSync(this.jsonFilePath)) {
      const seedContent = this.readSeedContent();
      fs.writeFileSync(this.jsonFilePath, seedContent, 'utf8');
    }
  }

  private readSeedContent(): string {
    if (fs.existsSync(this.sourceFilePath)) {
      try {
        return fs.readFileSync(this.sourceFilePath, 'utf8');
      } catch {
        return '[]\n';
      }
    }

    return '[]\n';
  }

  private resolveBackendRoot(): string {
    const candidates = [
      path.resolve(process.cwd(), 'packages/backend'),
      path.resolve(process.cwd()),
      path.resolve(__dirname, '../..'),
      path.resolve(__dirname, '../../..'),
    ];

    for (const candidate of candidates) {
      const packageJsonPath = path.join(candidate, 'package.json');
      if (!fs.existsSync(packageJsonPath)) continue;

      try {
        const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as { name?: string };
        if (pkg.name === '@openbet/backend') {
          return candidate;
        }
      } catch {
        continue;
      }
    }

    return path.resolve(process.cwd(), 'packages/backend');
  }

  private readProfiles(): UserProfile[] {
    this.ensureFile();

    try {
      const content = fs.readFileSync(this.jsonFilePath, 'utf8');
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? (parsed as UserProfile[]) : [];
    } catch {
      return [];
    }
  }

  private writeProfiles(profiles: UserProfile[]) {
    this.ensureFile();
    fs.writeFileSync(this.jsonFilePath, `${JSON.stringify(profiles, null, 2)}\n`, 'utf8');
  }

  private resolveWritableFilePath(): string {
    const configuredPath = (process.env.PROFILES_JSON_PATH ?? '').trim();
    if (configuredPath) {
      return path.resolve(configuredPath);
    }

    if (this.canWriteTo(path.dirname(this.sourceFilePath))) {
      return this.sourceFilePath;
    }

    const fallbackPath = path.join(os.tmpdir(), 'openbet-profiles.json');
    this.logger.warn(
      `Profiles storage is read-only at ${this.sourceFilePath}. Falling back to ${fallbackPath}.`,
    );
    return fallbackPath;
  }

  private canWriteTo(dirPath: string): boolean {
    try {
      fs.mkdirSync(dirPath, { recursive: true });
      fs.accessSync(dirPath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}
