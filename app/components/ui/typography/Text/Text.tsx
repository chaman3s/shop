import { ElementType, ComponentPropsWithoutRef } from "react";
import "./Text.css";

type TextProps<T extends ElementType> = {
  text: string;
  as: T;
} & ComponentPropsWithoutRef<T>;

export default function Text<T extends ElementType>({
  text,
  as,
  ...props
}: TextProps<T>) {
  const Ele = as;

  return <Ele {...props}>{text}</Ele>;
}