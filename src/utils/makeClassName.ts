export const makeClassName = (
  ...cls: Array<string | false | null | undefined>
) => cls.filter(Boolean).join(" ");
