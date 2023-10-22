async function preparePayload({
  mode,
  db,
  body,
  table: tableId,
  afterInsert,
}) {
  const table = await db("u-tables").get({ where: { id: tableId } });

  if (!table) throw new Error("404: Table not found!");

  const payload = {};
  for (let field of table.fields) {
    // check required only on insert
    if (
      mode === "insert" &&
      field.type !== "relation" &&
      field.required &&
      !body[field.name]
    ) {
      throw new Error(`400:${field.name}: this field is required`);
    }

    // number validation
    if (body[field.name] && field.type === "number") {
      if (isNaN(Number(body[field.name]))) {
        throw new Error(`400:${field.name}: this field should be a number`);
      } else {
        body[field.name] = +body[field.name];
      }

      if (typeof field.min !== 'undefined' && field.min > body[field.name]) {
        throw new Error(
          `400: the "${field.name}" field should be larger than ${field.min}`
        );
      }
      if (typeof field.max !== 'undefined' && field.max < body[field.name]) {
        throw new Error(
          `400: the "${field.name}" field should be smaller than ${field.min}`
        );
      }
      if (field.negative && 0 > body[field.name]) {
        throw new Error(
          `400: the "${field.name}" field should not be negative`
        );
      }
    }

    // string validation
    if (body[field.name] && (field.type === "plain_text" || field.type === "rich_text")) {
      if (typeof (body[field.name]) !== "string") {
        throw new Error(`400:${field.name}: this field should be a string`);
      }

      if (typeof field.min !== 'undefined' && field.min > body[field.name].length) {
        throw new Error(
          `400:${field.name}: this field should be larger than ${field.minlength}.`
        );
      }
      if (typeof field.max !== 'undefined' && field.max < body[field.name].length) {
        throw new Error(
          `400:${field.name}: this field should be smaller than ${field.minlength}.`
        );
      }
    }

    // switch validation
    if (body[field.name] && field.type === "switch") {
      if (!['true', 'false', true, false, 1, 0].includes(body[field.name])) {
        throw new Error(`400:${field.name}: this field should be boolean`);
      } else {
        body[field.name] = !!body[field.name];
      }
    }

    // date validation
    if (body[field.name] && field.type === "date_time") {
      if (typeof (body[field.name]) !== "date") {
        throw new Error(`400:${field.name}: this field should be in date format`);
      } else {
        body[field.name] = +body[field.name];
      }
    }

    // select validation
    if (body[field.name] && field.type === "select") {
      let values = field.options.split(',').map(x => x.trim()) ?? []
      if(!values.includes(body[field.name])){
        throw new Error(`400:${field.name}: this field must be one of ${values.map(x => `"${x}"`).join(', ')}`);
      }
    }

    // relation type
    if (
      typeof body[field.name + "_id"] !== "undefined" &&
      field.type === "relation"
    ) {
      if (field.multiple) {
        // user.posts
        // update other table
        const otherTable = await db("u-tables").get({
          where: { id: field.table },
        });
        const otherField = otherTable.fields.find(
          (x) => x.type === "relation" && x.name === field.field
        );

        if (otherField) {
          // update other table
          if (mode === "insert") {
            afterInsert(async (id) => {

              for (let otherId of body[field.name]) {
                await db(otherTable.id).update(otherId, {
                  [field.field + "_id"]: id, // id of new inserted item
                });
              }
            });
          } else {

            for (let otherId of body[field.name]) {
              await db(otherTable.id).update(otherId, {
                [field.field + "_id"]: id, // id of new inserted item
              });
            }
          }
        } else {
          throw new Error(
            `400:${field.name}: this relation field is not connected to other table 1..`
          );

          // not connected
        }
      } else {
        // blog.author
        const otherTable = await db("u-tables").get({
          where: { id: field.table },
        });
        const otherField = otherTable.fields.find(
          (x) =>
            x.type === "relation" &&
            x.table === tableId &&
            x.multiple &&
            x.field === field.name
        );

        if (otherField) {
          payload[field.name + "_id"] = body[field.name + "_id"];
        } else {
          // not connected
          throw new Error(
            `400:${field.name}: this relation field is not connected to other table..`
          );
        }
      }
    } else if (typeof body[field.name] !== "undefined") {
      payload[field.name] = body[field.name];
    }
  }

  return payload;
}

export async function insertData({ body, db, user }) {
  if (!body.table) throw new Error("400:table: Table is required!");
  if (!user) throw new Error("401: You don't have access!");

  const data = body.data;

  let afterInsertFn = undefined;
  function afterInsert(callback) {
    afterInsertFn = callback;
  }

  const payload = await preparePayload({
    mode: "insert",
    db,
    body: body.data,
    table: body.table,
    afterInsert,
  });

  payload.created_by = user.id;
  payload.updated_by = null;

  payload.created_at = new Date().valueOf();
  payload.updated_at = new Date().valueOf();

  console.log('insert', payload)
  const [id] = await db(body.table).insert(payload);
  data.id = id;

  if (afterInsertFn) {
    await afterInsertFn(id);
  }

  return {
    status: 200,
    message: "Data created successfully!",
    data,
  };
}

export async function updateData({ body, db, user }) {
  if (!body.table) throw new Error("400:table: this field is required!");
  if (!user) throw new Error("401: You don't have access!");

  const payload = await preparePayload({
    mode: "update",
    db,
    body: body.data,
    table: body.table,
    afterInsert: () => {},
  });

  const data = await db(body.table).get({ where: { id: body.id } });
  payload.updated_at = new Date().valueOf();
  payload.updated_by = user.id;

  await db(body.table).update(body.id, { ...data, ...payload });

  return {
    status: 200,
    message: "Data updated successfully!",
    data: await db(body.table).get({ where: { id: body.id } }),
  };
}

export async function removeData({ user, body, db }) {
  if (!body.table) throw new Error("400: Table is required!");
  if (!user) throw new Error("401: you don't have access");

  await db(body.table).remove(body.id);

  return {
    status: 200,
    message: "Data removed successfully!",
  };
}

export async function getData({ body, db }) {
  if (!body.table) throw new Error("404: Table not found");

  const rows = await db(body.table).query({
    where: body.where,
    perPage: body.perPage,
    page: body.page,
  });
  const table = await db("u-tables").get({ where: { id: body.table } });

  for (let value of rows.data) {
    for (let field of table.fields) {
      if (field.type === "relation") {
        if (field.multiple) {
          value[field.name] = await db(field.table)
            .query({
              where: {
                [field.field + "_id"]: {
                  operator: "=",
                  value: value.id,
                },
              },
            })
            .then((res) => res.data);
        } else {
          const id = value[field.name + "_id"];

          if (id) {
            const filters = { id: id };
            value[field.name] = await db(field.table).get({ where: filters });
          }
        }
      }
    }

    console.log({where: {id: value.created_by}})
    if(value.created_by) {
      value.created_by = await db('u-users').get({where: {id: value.created_by}})
    }
    if(value.updated_by) {
      value.updated_by = await db('u-users').get({where: {id: value.updated_by}})
    }
    console.log(await db('u-users').get())
  }

  return {
    status: 200,
    message: "success!",
    data: rows,
  };
}


export async function getDataHistory({body, db}) {
  if(!body.table) {
    throw new Error(`400:table: this field is required!`);
  }
  
  const rows = await db(body.table).history({where: body.where, page: body.page, perPage: body.perPage})
  
  console.log('getDataHistory', body.table)
  console.log(rows)

  for(let row of rows.data) {
    row.created_by = await db('u-users').get({where: {id: row.created_by ?? ''}})
  }  
  
  return {
    status: 200,
    message: 'success!',
    data: rows
  }
}

export async function recoverData({body, db}) {

  console.log(body)
  await db(body.table).recover(body.history_id)
  
  
  return {
    status: 200, 
    message: 'success!',
    data: true
  }
}