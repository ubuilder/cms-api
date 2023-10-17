export async function createComponent({body, db}) {
    const name = body.name
    
    if(!name) throw new Error("400: name: Name is required")    
  
    const component = {
      name,
      template: body.template ?? '',
      fields: body.fields ?? [],
    }
  
    const [id] = await db('u-components').insert(component)
  
    component.id = id
    
    return {
        status: 200,
        message: 'component created successfully!',
        data: component
    }
  }
  
  export async function updateComponent({body, db}) {
  
    await db('u-components').update(body.id, body.data)
    
    return {
        status: 200,
        message: 'Component updated successfully!',
        data: await db('u-components').get({where: {id: body.id}})
    }
  }
  
  export async function removeComponent({body, db}) {
   
    await db('u-components').remove(body.id)
    
    return {
        status: 200,
        message: 'Component removed successfully!'
    }
  }
  
  export async function getComponents({body, db}) {
    const data = await db('u-components').query({where: body.where, perPage: body.perPage, page: body.page});
    
    return {
        status: 200,
        message: 'success!',
        data
    }
  }