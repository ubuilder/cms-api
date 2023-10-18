import {validatePageCreate, validatePageUpdate} from "../validators/PageValidator.js"

export async function createPage({body, db}) {
    const title = body.title
    let slug = body.slug

    const load = body.load ?? []
    const actions = body.actions ?? []
    const slot = body.slot ?? []
    const dir = body.dir ?? 'ltr';
    const description = body.description ?? ''
       
    await validatePageCreate(body, db)

    if(slug.startsWith('/')) slug = slug.slice(1);

    const page = {
        title,
        slug,
        load,
        actions,
        slot,
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