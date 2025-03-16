import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf } = format;

const myFormat = printf(({ level, message, label, timestamp }) => {
  return `${timestamp} [${label}] ${level}: ${message}`;
});

export function newLogger(label: string) {
  const logger = createLogger({
    format: combine(
      format.label({ label }),
      timestamp({
        format: "YYYY-MM-DDTHH:mm:ss.SSSZZ",
      }),
      myFormat
    ),
    transports: [new transports.Console()],
    defaultMeta: { label },
  });
  return logger;
}
