export async function validateTableCreate(data, db) {

  const {name, slug, fields} = data

  if (!name) {
    throw new Error("Name is required");
  }

  const existingName = await db("u-tables").get({where: {name}});
  
  const existingSlug = await db("u-tables").get({where: {slug}});

  if (existingName) {
    throw new Error("Name must be unique");
  }

  if (existingSlug) {
    throw new Error("Slug must be unique");
  }

  const fieldNames = fields.map((field) => field.name);
  const uniqueFieldNames = new Set(fieldNames);

  if (fieldNames.length !== uniqueFieldNames.size) {
    throw new Error("Field names must be unique");
  }

  // // Function to check if a value is a number
  //  function isNumber(value) {
  //   return typeof value === "number" && !isNaN(value);
  // }

  // // Function to check if a value is a boolean
  //  function isBoolean(value) {
  //   return typeof value === "boolean";
  // }

  // // Function to check if a value is a string
  //  function isString(value) {
  //   return typeof value === "string";
  // }

  // Additional validation checks...

  return true;
}

export async function validateTableUpdate(data, db, id) {
  const {name, slug, fields} = data
  
  const existingName = await db("u-tables").query({where: { name, id: { operator: "!=", value: id }}}).get();

  const existingSlug = await db("u-tables").query({where: { slug, id: { operator: "!=", value: id }}}).get();

  if (existingName) {
    throw new Error("Name must be unique");
  }

  if (existingSlug) {
    throw new Error("Slug must be unique");
  }

  const fieldNames = fields.map((field) => field.name);
  const uniqueFieldNames = new Set(fieldNames);

  if (fieldNames.length !== uniqueFieldNames.size) {
    throw new Error("Field names must be unique");
  }

  return true;
}
