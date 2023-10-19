import postcss from "postcss";
import tailwind from "tailwindcss";

async function generateCss(template) {
  const tailwindConfig = {
    darkMode: "class",
  };

  const css = await postcss(
    tailwind({
      ...tailwindConfig,
      content: {
        files: [
          { raw: template, extension: "html" },
          // {raw: '<h1 class="p-4 font-bold text-red-600">Hello</h1>', extension: 'html'},
          // {raw: '<h2 class="p-8 font-bold bg-red-600">h2</h2>', extension: 'html'},
          // {raw: '<h3 class="border border-green-400 font-bold text-red-600">h3</h3>', extension: 'html'}
        ],
      },
    })
  )
    .process(`@tailwind utilities;`)
    .then((res) => {
      return res.css;
    })
  
    return css

}

export async function createComponent({ body, db }) {
  const name = body.name;

  if (!name) throw new Error("400: name: Name is required");

  const component = {
    name,
    template: body.template ?? "",
    fields: body.fields ?? [],
    css: body.template ? await generateCss(body.template) : ''
  };

  const [id] = await db("u-components").insert(component);

  component.id = id;

  return {
    status: 200,
    message: "component created successfully!",
    data: component,
  };
}

export async function updateComponent({ body, db }) {
  body.data.css = await generateCss(body.data.template);

  await db("u-components").update(body.id, body.data);

  return {
    status: 200,
    message: "Component updated successfully!",
    data: await db("u-components").get({ where: { id: body.id } }),
  };
}

export async function removeComponent({ body, db }) {
  await db("u-components").remove(body.id);

  return {
    status: 200,
    message: "Component removed successfully!",
  };
}

export async function getComponents({ body, db }) {
  const data = await db("u-components").query({
    where: body.where,
    perPage: body.perPage,
    page: body.page,
  });

  return {
    status: 200,
    message: "success!",
    data,
  };
}
