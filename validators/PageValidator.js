export async function validatePageCreate(data, db) {
  const { title, slug } = data;

  if (!title) {
    throw new Error("400:title: this field is required");
  }

  if (!slug) {
    throw new Error("400:slug: this field is required");
  }

  const existingSlug = await db("u-pages").get({ where: { slug } });

  if (existingSlug) {
    throw new Error("400:slug: this field must be unique");
  }

  if(typeof title !== "string") {
    throw new Error("400:title: this field must be string");
  }

  if(typeof slug !== "string") {
    throw new Error("400:slug: this field must be string");
  }

  return true;
}

export async function validatePageUpdate(data, db, id) {
  const { title, slug, load, actions, slot, dir, description } = data;

  const existingSlug = await db("u-tables").get({
    where: { slug, id: { operator: "!=", value: id } },
  });

  if (existingSlug) {
    throw new Error("400:slug: this field must be unique");
  }

  if(typeof title !== "string") {
    throw new Error("400:title: this field must be string");
  }

  if(typeof slug !== "string") {
    throw new Error("400:slug: this field must be string");
  }

  if(typeof description !== "string") {
    throw new Error("400:description: this field must be string");
  }

  if(dir !== "ltr" && dir !== "rtl") {
    throw new Error("400:dir: this field must be ltr or rtl");
  }

  if(!Array.isArray(load)){
    throw new Error("400:load: this field must be array");
  }

  if(!Array.isArray(slot)){
    throw new Error("400:slot: this field must be array");
  }

  if(!Array.isArray(actions)){
    throw new Error("400:action: this field must be array");
  }

  return true;
}
