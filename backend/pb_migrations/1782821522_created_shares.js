/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "name": "shares",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "shares_token",
        "name": "token",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 16,
          "max": 64,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "shares_resource",
        "name": "resource",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "zjckkfftcokrjek",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["name"]
        }
      },
      {
        "system": false,
        "id": "shares_created_by",
        "name": "created_by",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": ["name"]
        }
      },
      {
        "system": false,
        "id": "shares_expires_at",
        "name": "expires_at",
        "type": "date",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": "",
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "shares_revoked",
        "name": "revoked",
        "type": "bool",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {}
      },
      {
        "system": false,
        "id": "shares_view_count",
        "name": "view_count",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": null,
          "noDecimal": true
        }
      },
      {
        "system": false,
        "id": "shares_label",
        "name": "label",
        "type": "text",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 80,
          "pattern": ""
        }
      }
    ],
    "indexes": [
      "CREATE UNIQUE INDEX `idx_shares_token` ON `shares` (`token`)",
      "CREATE INDEX `idx_shares_resource` ON `shares` (`resource`)"
    ],
    "listRule": "@request.auth.id != ''",
    "viewRule": "id != ''",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id = created_by.id",
    "deleteRule": "@request.auth.id = created_by.id"
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  return dao.deleteCollection(dao.findCollectionByNameOrId("shares"));
});
