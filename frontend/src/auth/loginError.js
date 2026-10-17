export function getLoginErrorMessage(error) {
  if (error?.status === 403 && error?.path === "/api/auth/login") {
    const responseMessage = error.responseMessage ? `: ${error.responseMessage}` : "";
    return `Sign-in was rejected (HTTP 403)${responseMessage}. Check the POST /api/auth/login response in Network.`;
  }

  return error?.message || "Unable to sign in.";
}
