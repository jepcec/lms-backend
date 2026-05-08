// gerera tokens para la verifiacion de email y recuperacion de password
import { Injectable } from "@nestjs/common";
import * as crypto from 'crypto'

@Injectable()
export class CryptoTokenService {
	generateRamdomToken(): string {
		return crypto.randomBytes(32).toString('hex')
	}
}
