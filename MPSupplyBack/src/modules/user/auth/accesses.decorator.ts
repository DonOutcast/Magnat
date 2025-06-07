import { SetMetadata } from '@nestjs/common';

export const ACCESSES_KEYS = 'accesses';

export const Accesses = (...accesses: string[]) => SetMetadata(ACCESSES_KEYS, accesses);
