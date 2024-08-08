export function ClientSection() {
  return (
    <section
      id="clients"
      className="mx-auto max-w-[80rem] px-6 text-center md:px-8"
    >
      <div className="mx-auto max-w-screen-xl px-4 md:px-8">
        <h2 className="text-center text-sm font-semibold text-gray-600">
          TRUSTED BY FOUNDERS FROM AROUND THE WORLD
        </h2>
        <div className="mt-6">
          <ul className="flex flex-wrap items-center justify-center gap-x-10 gap-y-6 md:gap-x-16 [&_path]:fill-white">
            <li>
              <img
                src={`https://cdn.magicui.design/companies/Google.svg`}
                className="h-8 w-28 px-2 dark:brightness-0 dark:invert"
                alt="Google"
              />
            </li>
            <li>
              <img
                src={`https://cdn.magicui.design/companies/Microsoft.svg`}
                className="h-8 w-28 px-2 dark:brightness-0 dark:invert"
                alt="Microsoft"
              />
            </li>
            <li>
              <img
                src={`https://cdn.magicui.design/companies/GitHub.svg`}
                className="h-8 w-28 px-2 dark:brightness-0 dark:invert"
                alt="GitHub"
              />
            </li>

            <li>
              <img
                src={`https://cdn.magicui.design/companies/Uber.svg`}
                className="h-8 w-28 px-2 dark:brightness-0 dark:invert"
                alt="Uber"
              />
            </li>
            <li>
              <img
                src={`https://cdn.magicui.design/companies/Notion.svg`}
                className="h-8 w-28 px-2 dark:brightness-0 dark:invert"
                alt="Notion"
              />
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
