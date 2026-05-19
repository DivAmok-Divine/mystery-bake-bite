import { type User } from '../lib/db';
import { ADMIN_ROLE_ID } from './roles';

// Pure JS SHA-256 cryptographic hashing helper
export function hashPassword(password: string): string {
  function sha256(ascii: string): string {
    function rightRotate(value: number, amount: number): number {
      return (value >>> amount) | (value << (32 - amount));
    }
    
    const mathPow = Math.pow;
    const maxWord = mathPow(2, 32);
    let result = '';
    const words: number[] = [];
    const asciiLength = ascii.length * 8;
    
    let i: number, j: number;
    
    const hash: number[] = [];
    const k: number[] = [];
    let primeCounter = 0;
    
    const isPrime = (n: number): boolean => {
      for (let factor = 2; factor * factor <= n; factor++) {
        if (n % factor === 0) return false;
      }
      return true;
    };
    
    for (let candidate = 2; primeCounter < 64; candidate++) {
      if (isPrime(candidate)) {
        if (primeCounter < 8) {
          hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        }
        k[primeCounter] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
        primeCounter++;
      }
    }
    
    let asciiWithPadding = ascii + '\x80';
    while ((asciiWithPadding.length * 8) % 512 !== 448) {
      asciiWithPadding += '\x00';
    }
    
    for (i = 0; i < asciiWithPadding.length; i++) {
      const charCode = asciiWithPadding.charCodeAt(i);
      if (charCode > 0xff) return '';
      words[i >> 2] |= charCode << (24 - (i % 4) * 8);
    }
    
    words[words.length] = (asciiLength / maxWord) | 0;
    words[words.length] = asciiLength | 0;
    
    for (j = 0; j < words.length; j += 16) {
      const w: number[] = [];
      const workingHash = [...hash];
      
      for (i = 0; i < 64; i++) {
        if (i < 16) {
          w[i] = words[j + i] | 0;
        } else {
          const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
          const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
          w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
        }
        
        const temp1 = (workingHash[7] + (rightRotate(workingHash[4], 6) ^ rightRotate(workingHash[4], 11) ^ rightRotate(workingHash[4], 25)) + ((workingHash[4] & workingHash[5]) ^ (~workingHash[4] & workingHash[6])) + k[i] + w[i]) | 0;
        const temp2 = ((rightRotate(workingHash[0], 2) ^ rightRotate(workingHash[0], 13) ^ rightRotate(workingHash[0], 22)) + ((workingHash[0] & workingHash[1]) ^ (workingHash[0] & workingHash[2]) ^ (workingHash[1] & workingHash[2]))) | 0;
        
        workingHash[7] = workingHash[6];
        workingHash[6] = workingHash[5];
        workingHash[5] = workingHash[4];
        workingHash[4] = (workingHash[3] + temp1) | 0;
        workingHash[3] = workingHash[2];
        workingHash[2] = workingHash[1];
        workingHash[1] = workingHash[0];
        workingHash[0] = (temp1 + temp2) | 0;
      }
      
      for (i = 0; i < 8; i++) {
        hash[i] = (hash[i] + workingHash[i]) | 0;
      }
    }
    
    for (i = 0; i < 8; i++) {
      const hex = (hash[i] >>> 0).toString(16).padStart(8, '0');
      result += hex;
    }
    
    return result;
  }
  
  return sha256(password);
}

export const ADMIN_USER_ID = 'a1c84b4a-f326-444a-a38f-a9cb6b6c085f';

export const SEEDED_USERS: User[] = [
  {
    id: ADMIN_USER_ID,
    name: 'DivAmok',
    roleId: ADMIN_ROLE_ID,
    password: hashPassword('password1'),
    createdAt: new Date('2026-05-18T00:00:00Z')
  }
];
