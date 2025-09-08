import { Prisma } from '@prisma/client';

export class IdentifierUtil {
  private static isValidUUID(str: string): boolean {
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(str);
  }

  private static isValidEmail(str: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(str);
  }

  /**
   * Classifica automaticamente um identificador e retorna a clausula WHERE apropriada
   * @param identifier - ID (UUID), email ou username
   * @returns Clausula WHERE do Prisma para buscar o usuário
   */
  static classifyIdentifier(identifier: string): Prisma.UserWhereUniqueInput {
    if (this.isValidUUID(identifier)) {
      // É um UUID (id)
      return { id: identifier };
    } else if (this.isValidEmail(identifier)) {
      // É um email
      return { email: identifier };
    } else {
      // É um username
      return { username: identifier };
    }
  }
}
