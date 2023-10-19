export async function updateFile({body, db, user}) {
    if(!user) throw new Error('401: You are not authorized');


    // should not change type
    delete body.data['type']
    const res = await db('u-assets').update(body.id, body.data)
    
    return {
        status: 200,
        message: 'Success!',
        data: res
    }   
}

export async function removeFile({body, db, user}) {
    if(!user) throw new Error('401: You are not authorized');

    const res = await db('u-assets').remove(body.id)
 
    return {
        status: 200,
        message: 'Success!',
        data: res
    }
}

export async function getFiles({body, db, user}) {
    const files = await db('u-assets').query({where: body.where, perPage: body.perPage, page: body.page});

    return {
        status: 200,
        message: 'Success!',
        data: files
    }   
}

