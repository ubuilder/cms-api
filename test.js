import test from "ava";
import fs from "fs";
import { connect } from "@ulibs/db";

const db = connect({ filename: `./data/test/db.json` }).getModel;
const DB_FILE_PATH = "./data/test/db.json";

//clear the data file
test.beforeEach(() => {
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
    { instanceOf: Error, message: "Name is required" }
  );
});
//unique name
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
    { instanceOf: Error, message: "Name must be unique" }
  );
});
//unique slug
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
    { instanceOf: Error, message: "Slug must be unique" }
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
    { instanceOf: Error, message: "Field names must be unique" }
  );
});
//====================================================================================
