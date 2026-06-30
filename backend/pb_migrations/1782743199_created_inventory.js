/// <reference path="../pb_data/types.d.ts" />
migrate((db) => {
  const collection = new Collection({
    "id": "6xzob5fb3f5l52h",
    "created": "2026-06-29 14:26:39.510Z",
    "updated": "2026-06-29 14:26:39.510Z",
    "name": "inventory",
    "type": "base",
    "system": false,
    "schema": [
      {
        "system": false,
        "id": "vnxq9yct",
        "name": "item_name",
        "type": "text",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": null,
          "max": 200,
          "pattern": ""
        }
      },
      {
        "system": false,
        "id": "jmsckwxi",
        "name": "quantity",
        "type": "number",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "3itdscuf",
        "name": "unit",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "pieces",
            "lbs",
            "kg",
            "sqft",
            "sqm"
          ]
        }
      },
      {
        "system": false,
        "id": "vze6v3bl",
        "name": "location",
        "type": "select",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "maxSelect": 1,
          "values": [
            "warehouse",
            "job_site",
            "in_transit"
          ]
        }
      },
      {
        "system": false,
        "id": "3ih1p0lg",
        "name": "cost_per_unit",
        "type": "number",
        "required": false,
        "presentable": false,
        "unique": false,
        "options": {
          "min": 0,
          "max": null,
          "noDecimal": false
        }
      },
      {
        "system": false,
        "id": "q2xbcxfu",
        "name": "project",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "zjckkfftcokrjek",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      },
      {
        "system": false,
        "id": "tabvn1iq",
        "name": "last_updated",
        "type": "date",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "min": "",
          "max": ""
        }
      },
      {
        "system": false,
        "id": "ju0qohpu",
        "name": "user",
        "type": "relation",
        "required": true,
        "presentable": false,
        "unique": false,
        "options": {
          "collectionId": "_pb_users_auth_",
          "cascadeDelete": true,
          "minSelect": null,
          "maxSelect": 1,
          "displayFields": null
        }
      }
    ],
    "indexes": [],
    "listRule": "@request.auth.id != '' && user = @request.auth.id",
    "viewRule": "@request.auth.id != '' && user = @request.auth.id",
    "createRule": "@request.auth.id != ''",
    "updateRule": "@request.auth.id != '' && user = @request.auth.id",
    "deleteRule": "@request.auth.id != '' && user = @request.auth.id",
    "options": {}
  });

  return Dao(db).saveCollection(collection);
}, (db) => {
  const dao = new Dao(db);
  const collection = dao.findCollectionByNameOrId("6xzob5fb3f5l52h");

  return dao.deleteCollection(collection);
})
