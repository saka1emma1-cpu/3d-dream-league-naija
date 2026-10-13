interface Props {
  src: string;
  alt: string;
}

export function AvatarImg({ src, alt }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      loading="lazy"
      draggable={false}
    />
  );
}

export default AvatarImg;
