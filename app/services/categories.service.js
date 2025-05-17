import BaseService from "./shared.service.js";

export default class CategoriesService{
  constructor() {
    this.baseService = new BaseService();
  }

 async retrieveCategories(){
    return await this.baseService.get("create-lobby/categories")
 }
}
