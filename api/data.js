async function preparePayload({
  mode,
  db,
  body,
  table: tableName,
  afterInsert,
}) {
  const table = await db("u-tables").get({ where: { slug: tableName } });

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
      throw new Error(`400: the "data.${field.name}" is required`);
    }

    // number validation
    if (body[field.name] && field.type === "number") {
      if (isNaN(Number(body[field.name]))) {
        throw new Error(`400: the "${field.name}" field should be a number`);
      } else {
        body[field.name] = +body[field.name];
      }

      if (typeof field.min !== undefined && field.min > body[field.name]) {
        throw new Error(
          `400: the "${field.name}" field should be larger than ${field.min}`
        );
      }
      if (typeof field.max !== undefined && field.max < body[field.name]) {
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
        throw new Error(`400: the "${field.name}" field should be a string`);
      } else {
        body[field.name] = +body[field.name];
      }

      if (typeof field.min !== undefined && field.min > body[field.name]) {
        throw new Error(
          `400: the "${field.name}" field should be larger than ${field.min}`
        );
      }
      if (typeof field.max !== undefined && field.max < body[field.name]) {
        throw new Error(
          `400: the "${field.name}" field should be smaller than ${field.min}`
        );
      }
    }

    // string validation
    if (body[field.name] && field.type === "switch") {
      if (typeof (body[field.name]) !== "boolean") {
        throw new Error(`400: the "${field.name}" field should be boolean`);
      } else {
        body[field.name] = +body[field.name];
      }
    }

    // date validation
    if (body[field.name] && field.type === "date_time") {
      if (typeof (body[field.name]) !== "date") {
        throw new Error(`400: the "${field.name}" field should be in date format`);
      } else {
        body[field.name] = +body[field.name];
      }
    }

    // select validation
    if (body[field.name] && field.type === "select") {
      let values = field.options.split(",").trim();
      for(let value of values ?? []){
        if (typeof (body[field.name]) !== value) {
          throw new Error(`400: the "${field.name}" field should be in select options`);
        }
      }
    }

    console.log(body[field.name]);
    // relation type
    if (
      typeof body[field.name + "_id"] !== "undefined" &&
      field.type === "relation"
    ) {
      console.log("relation: ", field);
      if (field.multiple) {
        // user.posts
        // update other table
        const otherTable = await db("u-tables").get({
          where: { slug: field.table },
        });
        console.log(field, otherTable);
        const otherField = otherTable.fields.find(
          (x) => x.type === "relation" && x.name === field.field
        );
        console.log(otherField, otherTable.fields);

        if (otherField) {
          // update other table
          if (mode === "insert") {
            afterInsert(async (id) => {
              console.log(
                "after insert: id: ",
                id,
                "body field name: ",
                body[field.name]
              );
              for (let otherId of body[field.name]) {
                await db(otherTable.slug).update(otherId, {
                  [field.field + "_id"]: id, // id of new inserted item
                });
              }
            });
          } else {
            console.log(
              `[${mode} - ${id}] set `,
              field.field + "_id",
              "of ",
              otherTable.slug,
              " to " + id,
              "where there ids are",
              body[field.name]
            );
            for (let otherId of body[field.name]) {
              await db(otherTable.slug).update(otherId, {
                [field.field + "_id"]: id, // id of new inserted item
              });
            }
          }
        } else {
          throw new Error(
            "400: this relation field is not connected to other table 1.."
          );

          // not connected
        }
      } else {
        // blog.author
        const otherTable = await db("u-tables").get({
          where: { slug: field.table },
        });
        const otherField = otherTable.fields.find(
          (x) =>
            x.type === "relation" &&
            x.table === tableName &&
            x.multiple &&
            x.field === field.name
        );

        console.log({ otherTable, otherField });

        if (otherField) {
          payload[field.name + "_id"] = body[field.name + "_id"];
        } else {
          // not connected
          throw new Error(
            "400: this relation field is not connected to other table.."
          );
        }
      }
    } else if (typeof body[field.name] !== "undefined") {
      payload[field.name] = body[field.name];
    }
  }

  console.log("payload: ", payload, table);
  return payload;
}

export async function insertData({ body, db, user }) {
  if (!body.table) throw new Error("400: Table is required!");
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
  console.log(payload);

  payload.created_by = user.id;
  payload.updated_by = null;

  payload.created_at = new Date().valueOf();
  payload.updated_at = new Date().valueOf();

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
  if (!body.table) throw new Error("400: Table is required!");
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

  console.log({ payload, data });
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
  const table = await db("u-tables").get({ where: { slug: body.table } });

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
  }

  return {
    status: 200,
    message: "success!",
    data: rows,
  };
}
