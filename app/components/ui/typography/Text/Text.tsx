import { JSX } from "react";
import "./Text.css"
type Textprops ={
    text: string;
    as : keyof JSX.IntrinsicElements;
} & React.HTMLAttributes<HTMLElement>;
export default function Text({text,as ,...props}:Textprops){
    const Ele = as;
    return (<Ele {...props}>{text}</Ele>)
    
}