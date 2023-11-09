import postcss from "postcss";
import tailwind from "tailwindcss";
import {writeFileSync, rmSync, readFileSync, existsSync, mkdirSync} from 'fs'
import { getDb } from "../lib/db.js";

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

export async function createComponent({ body, db, params }) {
  const name = body.name;

  if (!name) throw new Error("400:name: Name is required");
  
  // validate tempalte should be string or undefined
  

  if(!existsSync(`./data/${params.siteId}/components`)) {
    mkdirSync(`./data/${params.siteId}/components`)
  }
  
  const component = {
    name,
    raw: body.template ? true : false,
    slot: body.slot ?? [],
    fields: body.fields ?? [],
    css: body.template ? await generateCss(body.template) : ''
  };

  const [id] = await db("u-components").insert(component);

  if(body.raw) {
    writeFileSync(`./data/${params.siteId}/components/${id}.hbs`, body.template ?? '');
  }


  component.id = id;

  return {
    status: 200,
    message: "component created successfully!",
    data: component,
  };
}

export async function updateComponent({ body, db, params}) {
  // body.data.css = await generateCss(body.data.template);

  if(body.data.template) {
    const path = `./data/${params.siteId}/components/${body.id}.hbs`
  
    writeFileSync(path, body.data.template);
  }
  
  delete body.data['template']

  await db("u-components").update(body.id, body.data);

  return {
    status: 200,
    message: "Component updated successfully!",
    data: await db("u-components").get({ where: { id: body.id } }),
  };
}

export async function removeComponent({ body, db, params }) {
  await db("u-components").remove(body.id);

  const path = `./data/${params.siteId}/components/${body.id}.hbs`
  try {
    rmSync(path);
  } catch(err) {
    // 
  }

  return {
    status: 200,
    message: "Component removed successfully!",
  };
}

async function getGlobalComponents({user}) {
  const globalDb = getDb('components', user)
  const data = await globalDb('u-components').query({
    perPage: 1000
  })


  return data.data.map(x => {
    x.template = x.raw ? readFileSync(`./data/components/components/${x.id}.hbs`, 'utf-8') : ''
    
    x.global = true
    return x
  })

}

export async function getComponents({ siteId, body, db, params, user }) {
  const globalComponents = await getGlobalComponents({user})
  
  const data = await db("u-components").query({
    where: body.where,
    perPage: body.perPage,
    page: body.page,
  });

  data.data.map(x => {
    x.template = x.raw ? readFileSync(`./data/${params.siteId}/components/${x.id}.hbs`, 'utf-8') : ''
    return x
  })

  if(siteId !== 'components') {
    data.data = [...globalComponents, data.data]
  }

  return {
    status: 200,
    message: "success!",
    data,
  };
}
