export async function validateComponentCreate(data, db) {
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
  
  export async function validateComponentUpdate(data, db, id) {
    const { title, slug, load, actions, slot, dir, description } = data;
  
    const existingSlug = await db("u-pages").get({
      where: { slug, id: { operator: "!=", value: id } },
    });
  
    if (existingSlug) {
      throw new Error("400:slug: this field must be unique");
    }
  
    if(typeof title !== "string" && title) {
      throw new Error("400:title: this field must be string");
    }
  
    if(typeof slug !== "string" && slug) {
      throw new Error("400:slug: this field must be string");
    }
  
    if(typeof description !== "string" && description) {
      throw new Error("400:description: this field must be string");
    }
  
    if(dir !== "ltr" && dir !== "rtl" && dir) {
      throw new Error("400:dir: this field must be ltr or rtl");
    }
  
    if(!Array.isArray(load) && load){
      throw new Error("400:load: this field must be array");
    }
  
    if(!Array.isArray(slot) && slot){
      throw new Error("400:slot: this field must be array");
    }
  
    if(!Array.isArray(actions) && actions){
      throw new Error("400:actions: this field must be array");
    }
  
    return true;
  }
  