// Não há passo distinto de "cadastro" no app -- login e criação de conta
// são o mesmo fluxo de código por e-mail. Distingo conta recém-criada de
// conta antiga com pendência retroativa pela idade de user.created_at:
// se a conta nasceu há poucos minutos, é a primeira sessão de verdade.
export const FRESH_SIGNUP_WINDOW_MS = 10 * 60 * 1000

export function isFreshSignup(user) {
  return Date.now() - new Date(user.created_at).getTime() < FRESH_SIGNUP_WINDOW_MS
}
