const kwInsert = "insert into ";
const kwUpdate = "update ";
const kwDelete = "delete from ";

export const getTableName = (sqlString: string): string => {
    const sqlStringL = sqlString.toLowerCase();

    const idxInsert = sqlStringL.indexOf(kwInsert);
    const idxUpdate = sqlStringL.indexOf(kwUpdate);
    const idxDelete = sqlStringL.indexOf(kwDelete);
  
    if (idxInsert !== -1) {
        return sqlString.slice(idxInsert + kwInsert.length).split(" ")[0];
    }
    if (idxUpdate !== -1) {
        return sqlString.slice(idxUpdate + kwUpdate.length).split(" ")[0];
    }
    if (idxDelete !== -1) {
        return sqlString.slice(idxDelete + kwDelete.length).split(" ")[0];
    }
    throw new Error("Cant get table from sql: " + sqlString);
}
  