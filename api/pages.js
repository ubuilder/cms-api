import postcss from "postcss";
import {validatePageCreate, validatePageUpdate} from "../validators/PageValidator.js"

import typography  from '@tailwindcss/typography'
import tailwind from "tailwindcss";
import { getComponents } from "./components.js";

async function generateCss(templates) {
  const tailwindConfig = {
    darkMode: "class",
  };

  const css = await postcss(
    tailwind({
      ...tailwindConfig,
      content: {
        files: templates.map(x => ({raw: x, extension: 'html'}))
      },
      plugins: [
        typography
      ]
    })
  )
    .process(`@tailwind base; @tailwind utilities;`)
    .then((res) => {
      return res.css;
    })
  
    return css

}


export async function createPage({body, db}) {
    const title = body.title
    let slug = body.slug

    const load = body.load ?? []
    const actions = body.actions ?? []
    const slot = body.slot ?? []
    const dir = body.dir ?? 'ltr';
    const head = body.head ?? `<meta name="description" content="{{page.description}}"/>
<title>{{page.title}}</title>
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>`
    const description = body.description ?? ''
       
    await validatePageCreate(body, db)

    if(slug.startsWith('/')) slug = slug.slice(1);

    const page = {
        title,
        slug,
        load,
        actions,
        slot,
        head,
        dir,
        description
    }

    const [id] = await db('u-pages').insert(page)

    page.id = id
    
    return {
        status: 200,
        message: 'Page created successfully!',
        data: page
    }
}

export async function updatePage({body, db}) {

    await db('u-pages').update(body.id, body.data)

    await validatePageUpdate(body.data, db, body.id)
    
    return {
        status: 200,
        message: 'Page updated successfully!',
        data: await db('u-pages').get({where: {id: body.id}})
    }
}

export async function removePage({body, db}) {
   
    await db('u-pages').remove(body.id)
    
    return {
        status: 200,
        message: 'Page removed successfully!'
    }
}

export async function getPages({body, db}) {
    const data = await db('u-pages').query({where: body.where, perPage: body.perPage, page: body.page});
    
    return {
        status: 200,
        message: 'success!',
        data
    }
}

export async function getPageCss({body, db, params}) {

  const page_id = body.page_id;

  const components = getComponents({body: {perPage: 1000}, db, params})

  // filter components by page id


  const css = await generateCss((await components).data.data.map(x => x.template));


  return {
    message: 'Success',
    status: 200,
    data: css
  }  
}