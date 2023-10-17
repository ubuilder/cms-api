export async function setSettings({db, body}) {
    const settings = await db('u-settings').get();
    if(!settings) {
        await db('u-settings').insert(body)
    } else {
        await db('u-settings').update(settings.id, body)
    }

    return {
        message: 'setting udpated successfully',
        status: 200,
        data: await db('u-settings').get()
    }
}

export async function getSettings({db}) {
    const settings = await db('u-settings').get();

    return {
        message: 'setting udpated successfully',
        status: 200,
        data: settings
    }
}
