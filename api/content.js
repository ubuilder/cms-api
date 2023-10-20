import { slugify } from "../lib/helpers.js";
import { validateTableCreate, validateTableUpdate} from "../validators/TableValidator.js"

export async function createTable({ body, db }) {
  const name = body.name;
  const fields = body.fields ?? [];
  const icon = body.icon ?? [];

  let slug = slugify(body.name);

  await validateTableCreate(body, db)

  const table = {
    name,
    icon,
    slug,
    fields,
  };

  const [id] = await db("u-tables").insert(table);

  table.id = id;

  return {
    status: 200,
    message: "Table created successfully!",
    data: table,
  };
}

export async function updateTable({ body, db }) {

  body.data.slug = slugify(body.data.name)

  await validateTableUpdate(body.data, db, body.id)

  
  await db("u-tables").update(body.id, body.data);

  return {
    status: 200,
    message: "Table updated successfully!",
    data: await db("u-tables").get({ where: { id: body.id } }),
  };
}

export async function removeTable({ body, db }) {
  await db("u-tables").remove(body.id);

  // db.dropTable(body.id)
  throw new Error("501: (not implemented) drop collection from database");

  return {
    status: 200,
    message: "Table removed successfully!",
  };
}

export async function getTables({ body, db }) {
  const data = await db("u-tables").query({
    where: body.where,
    perPage: body.perPage,
    page: body.page,
  });

  return {
    status: 200,
    message: "success!",
    data,
  };
}
