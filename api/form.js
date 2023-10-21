export async function getForms({body, db}) {

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
    

    const result = await db('u-forms').insert({
        form: body.form, // string
        page: body.page,
        data: body.data
    })

    return {
        message: 'form successfully submitted!',
        status: 200,
        data: result[0]
    }
}