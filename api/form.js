export async function getForms({body, db}) {
    console.log('getForms', body)

    return {
        message: 'success',
        status: 200,
        data: await db('u-forms').query({where: {page: body.page}})
    }
}
export async function submitForm({body, db}) {
    // valiate ...
    // form => string
    // page => page id (string)
    // data => object (anything)
    console.log('submitForm', body)
    
    const created_at = new Date().valueOf()

    const result = await db('u-forms').insert({
        form: body.form, // string
        pathname: body.pathname,
        page: body.page,
        data: body.data,
        created_at
    })

    return {
        message: 'form successfully submitted!',
        status: 200,
        data: result[0]
    }
}