export function response(message: string, data: any = null) {
  return {
    status: 'success',
    message,
    data,
  };
}
