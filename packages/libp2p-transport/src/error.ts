type runtimeError = "ConnectError" | "ChannelNotFound";

export const runtimeError = (type: runtimeError, msg: string) => {
  const err = new Error(msg);
  err.name = type;
  return err;
};
