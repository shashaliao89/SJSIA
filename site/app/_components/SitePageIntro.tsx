export function SitePageIntro({
  eyebrow,
  title,
  description,
  centered = true,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={centered ? "mb-12 text-center md:mb-14" : "mb-10 md:mb-12"}>
      <p className="site-eyebrow mb-3">{eyebrow}</p>
      <h1 className="text-4xl font-black tracking-tight md:text-5xl">{title}</h1>
      {description ? (
        <p className={`mt-4 text-lg text-gray-400 ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
          {description}
        </p>
      ) : null}
    </div>
  );
}
