import test from "ava";
import fs from "fs";
import { connect } from "@ulibs/db";

const db = connect({ filename: `./data/test/db.json` }).getModel;
const DB_FILE_PATH = "./data/test/db.json";

//clear the data file
test.afterEach(() => {
  if (fs.existsSync(DB_FILE_PATH)) {
    fs.writeFileSync(DB_FILE_PATH, "");
  }
});

//table tests=====================================================================
import {
  validateTableCreate,
  validateTableUpdate,
} from "./validators/TableValidator.js";

test("Create operation - Valid table data", async (t) => {
  const tableData = {
    name: "Table1",
    slug: "table1",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field2", type: "text" },
    ],
  };

  const result = await validateTableCreate(tableData, db);
  t.true(result);
});
//required name
test("required name", async (t) => {
  const tableData = {
    slug: "table3",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field2", type: "text" },
    ],
  };

  await t.throwsAsync(
    async () => {
      await validateTableCreate(tableData, db);
    },
    { instanceOf: Error, message: "400:name: this field is required" }
  );
});

// unique name
test("unique name", async (t) => {
  await db("u-tables").insert({ name: "name" });

  const tableData = {
    name: "name",
    slug: "slug",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field2", type: "text" },
    ],
  };

  await t.throwsAsync(
    async () => {
      await validateTableCreate(tableData, db);
    },
    { instanceOf: Error, message: "400:name: this field must be unique" }
  );
});
// unique slug
test("unique slug", async (t) => {
  await db("u-tables").insert({ slug: "table2" });

  const tableData = {
    name: "table1",
    slug: "table2",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field2", type: "text" },
    ],
  };

  await t.throwsAsync(
    async () => {
      await validateTableCreate(tableData, db);
    },
    { instanceOf: Error, message: "400:slug: this field must be unique" }
  );
});

//unique field names
test("unique field names", async (t) => {
  const tableData = {
    name: "table1",
    slug: "table2",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field1", type: "text" },
    ],
  };

  await t.throwsAsync(
    async () => {
      await validateTableCreate(tableData, db);
    },
    { instanceOf: Error, message: "400:field_name: this field must be unique" }
  );
});

//update table 
test("Update operation - Valid table data", async (t) => {
  let newtable = await db("u-tables").insert({ name: "table2" });

  const tableData = {
    name: "Table1",
    slug: "table1",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field2", type: "text" },
    ],
  };

  const result = await validateTableUpdate(tableData, db, newtable[0]);
  t.true(result);
});

//unique name with itself 
test("update unique name", async (t) => {
  let newtable = await db("u-tables").insert({ name: "name" });

  const tableData = {
    name: "name",
    slug: "slug",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field2", type: "text" },
    ],
  };

  const result = await validateTableUpdate(tableData, db, newtable[0]);
  t.true(result);
});
//unique slug with itself 
test("update unique slug", async (t) => {
  let newtable = await db("u-tables").insert({ slug: "slug" });

  const tableData = {
    name: "name",
    slug: "slug",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field2", type: "text" },
    ],
  };

  const result = await validateTableUpdate(tableData, db, newtable[0]);
  t.true(result);
});
//unique name with another table
test("update with another table unique name", async (t) => {
  let anothertable = await db("u-tables").insert({name: "name"})
  let newtable = await db("u-tables").insert({ name: "name1" });

  const tableData = {
    name: "name",
    slug: "table2",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field2", type: "text" },
    ],
  };

  await t.throwsAsync(
    async () => {
      await validateTableUpdate(tableData, db, newtable[0]);
    },
    { instanceOf: Error, message: "400:name: this field must be unique" }
  );
});

// unique slug with another table
test("update with another table unique slug", async (t) => {
  let anothertable = await db("u-tables").insert({slug: "slug"})
  let newtable = await db("u-tables").insert({ slug: "slug1" });

  const tableData = {
    name: "table1",
    slug: "slug",
    fields: [
      { name: "Field1", type: "text" },
      { name: "Field2", type: "text" },
    ],
  };

  await t.throwsAsync(
    async () => {
      await validateTableCreate(tableData, db);
    },
    { instanceOf: Error, message: "400:slug: this field must be unique" }
  );
});

//update unique field names
test("update unique field names", async (t) => {
  let newtable = await db("u-talbes").insert({name: "name", fields:[
    {
      name: "field1",
      type: "type"
    },
    {
      name: "field1",
      type: "another type"
    }
  ]})

  const tableData = {
    name: "table1",
    slug: "table2",
    fields: [
      { name: "field1", type: "text" },
      { name: "field1", type: "text" },
    ],
  };

  await t.throwsAsync(
    async () => {
      await validateTableCreate(tableData, db);
    },
    { instanceOf: Error, message: "400:field_name: this field must be unique" }
  );
});

//page tests=====================================================================
import {
  validatePageCreate,
  validatePageUpdate,
} from "./validators/PageValidator.js";
//create tests
test("Create operation - Valid page data", async (t) => {
  const pageData = {
    title: "home",
    slug: "page-slug",
  };

  const result = await validatePageCreate(pageData, db);
  t.true(result);
});

//invalid string title 
test("invalid title", async (t) => {
  const pageData = {
    title: 2323,
    slug: "slug",
  };

  await t.throwsAsync(
    async () => {
      await validatePageCreate(pageData, db);
    },
    { instanceOf: Error, message: "400:title: this field must be string" }
  );
});
//invalid string slug 
test("invalid slug", async (t) => {
  const pageData = {
    title: "title",
    slug: 23423,
  };

  await t.throwsAsync(
    async () => {
      await validatePageCreate(pageData, db);
    },
    { instanceOf: Error, message: "400:slug: this field must be string" }
  );
});
//required title 
test("required title", async (t) => {
  const pageData = {
    slug: "slug",
  };

  await t.throwsAsync(
    async () => {
      await validatePageCreate(pageData, db);
    },
    { instanceOf: Error, message: "400:title: this field is required" }
  );
});
//required slug 
test("required slug", async (t) => {
  const pageData = {
    title: "title",
  };

  await t.throwsAsync(
    async () => {
      await validatePageCreate(pageData, db);
    },
    { instanceOf: Error, message: "400:slug: this field is required" }
  );
});
//unique slug 
test("unique page slug", async (t) => {
  await db("u-pages").insert({slug: "old-slug"})

  const pageData = {
    title: "title",
    slug: "old-slug"
  };

  await t.throwsAsync(
    async () => {
      await validatePageCreate(pageData, db);
    },
    { instanceOf: Error, message: "400:slug: this field must be unique" }
  );
});

//update page 
test("Update operation - Valid page data", async (t) => {
  let page = await db("u-pages").insert({title: "title", slug: "slug"})

  const pageData = {
    title: "home",
    slug: "page-slug",
    actions: [],
    load: [{name: "name", table: "users", filters:[], multiple: true}],
    slot: [{props: {color: "primary"}}],
    dir: "rtl",
    description: "description"
  };

  const result = await validatePageUpdate(pageData, db, page[0]);
  t.true(result);
});

//update unique slug 
test("update unique page slug", async (t) => {
  await db("u-pages").insert({slug: "old-slug"})
  let newpage = await db("u-pages").insert({slug: "slug"})

  const pageData = {
    title: "title",
    slug: "old-slug"
  };

  await t.throwsAsync(
    async () => {
      await validatePageUpdate(pageData, db, newpage[0]);
    },
    { instanceOf: Error, message: "400:slug: this field must be unique" }
  );
});
//update string title
test("update invalid page title", async (t) => {

  let newpage = await db("u-pages").insert({slug: "slugsldfjka", title: "title"})

  const pageData = {
    title: 343343,
    slug: "sluglafsjljksda"
  };

  await t.throwsAsync(
    async () => {
      await validatePageUpdate(pageData, db, newpage[0]);
    },
    { instanceOf: Error, message: "400:title: this field must be string" }
  );
});
//update string slug
test("update invalid page slug", async (t) => {

  let newpage = await db("u-pages").insert({title: "title", slug: "slug"})

  const pageData = {
    title: "slug",
    slug: 343343
  };

  await t.throwsAsync(
    async () => {
      await validatePageUpdate(pageData, db, newpage[0]);
    },
    { instanceOf: Error, message: "400:slug: this field must be string" }
  );
});
//update string description
test("update invalid page description", async (t) => {

  let newpage = await db("u-pages").insert({description: "slslsl"})

  const pageData = {
    title: "slug",
    slug: "lskjl",
    description: 2423
  };

  await t.throwsAsync(
    async () => {
      await validatePageUpdate(pageData, db, newpage[0]);
    },
    { instanceOf: Error, message: "400:description: this field must be string" }
  );
});
//update invalid dir
test("update invalid page direction", async (t) => {

  let newpage = await db("u-pages").insert({dir: "rtl"})

  const pageData = {
    title: "slug",
    slug: "lskjl",
    description: "slkjdlks",
    dir: "llr"
  };

  await t.throwsAsync(
    async () => {
      await validatePageUpdate(pageData, db, newpage[0]);
    },
    { instanceOf: Error, message: "400:dir: this field must be ltr or rtl" }
  );
});
//update invalid load
test("update invalid page load", async (t) => {

  let newpage = await db("u-pages").insert({load: [{table: "ssss"}]})

  const pageData = {
    title: "slug",
    slug: "lskjl",
    description: "slkjdlks",
    dir: "ltr",
    load: 423
  };

  await t.throwsAsync(
    async () => {
      await validatePageUpdate(pageData, db, newpage[0]);
    },
    { instanceOf: Error, message: "400:load: this field must be array"}
  );
});
//update invalid slot
test("update invalid page slots", async (t) => {

  let newpage = await db("u-pages").insert({slot: [{props: {name: "lsjkljksdf"}}]})

  const pageData = {
    title: "slug",
    slug: "lskjl",
    description: "slkjdlks",
    dir: "ltr",
    load: [{table: "lllll"}],
    slot: 23234
  };

  await t.throwsAsync(
    async () => {
      await validatePageUpdate(pageData, db, newpage[0]);
    },
    { instanceOf: Error, message: "400:slot: this field must be array"}
  );
});
//update invalid actions
test("update invalid page actions", async (t) => {

  let newpage = await db("u-pages").insert({actions: [{form: "submit"}]})

  const pageData = {
    title: "slug",
    slug: "lskjl",
    description: "slkjdlks",
    dir: "ltr",
    load: [{table: "lllll"}],
    slot: [{props: {name: "lskjsdlk"}}],
    actions: 4334
  };

  await t.throwsAsync(
    async () => {
      await validatePageUpdate(pageData, db, newpage[0]);
    },
    { instanceOf: Error, message: "400:actions: this field must be array"}
  );
});