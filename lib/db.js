import { connect } from "@ulibs/db";

export function getDb(siteId, user) {
    const getModel = connect({
      filename: "./data/" + siteId + "/db.json",
    }).getModel;
  
    const getHistoryModel = connect({
      filename: "./data/" + siteId + "/db_history.json",
    }).getModel;
  
    return (table) => {
      const db = getModel(table);
      const historyDb = getHistoryModel(table);
  
      async function insert(data) {
        const res = await db.insert(data);
        await historyDb.insert({
          data: {id: res[0], ...data},
          type: "insert",
          created_at: new Date().valueOf(),
          created_by: user?.id ?? null,
        });
  
        return res;
      }
  
      async function update(id, data) {
        const res = await db.update(id, data);
        await historyDb.insert({
          type: "update",
          data: await db.get({ where: { id } }),
          created_at: new Date().valueOf(),
          created_by: user?.id ?? null,
        });
  
        return res;
      }
  
      async function remove(id, data) {
        const res = await db.remove(id);
  
        await historyDb.insert({
          type: "remove",
          created_at: new Date().valueOf(),
          created_by: user?.id ?? null,
        });
  
        return res;
      }
  
      async function recover(history_id) {
        console.log('recovering..', history_id)
        const data = await historyDb.get({ where: { id: history_id } });
        console.log({data})
  
        const id = data.data.id;
        const body = data.data;
        await db.update(id, body);
  
        await historyDb.insert({
          type: "recover",
          history_id,
          created_at: new Date().valueOf(),
          created_by: user?.id ?? null,
        });
  
        return body;
      }
  
      return {
        insert,
        update,
        remove,
        history: historyDb.query,
        recover,
        query: db.query,
        get: db.get,
      };
    };
  }
  