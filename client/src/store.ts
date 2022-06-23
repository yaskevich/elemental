import { reactive } from "vue";
import axios, {AxiosRequestConfig} from "axios";
import project from '../package.json';

interface ITextObject {
  author: string,
  comments: boolean,
  grammar: boolean,
  id: number,
  meta: string,
  title: string,
  loaded: boolean,
};

interface IUserObject {
  id: number,
  username: string,
  firstname: string,
  lastname: string,
  email: string,
  sex: number,
  server: string,
  commit: string,
  text_id: number,
  text?: ITextObject,
};

interface IState {
  token?: string,
  error?: string,
  user?: IUserObject,
};

const state:IState = reactive({
  token: localStorage.getItem('token') || '',
  user: {},
  error: "",
}) as IState;

const getFile = async(route: string, id: string) : Promise<any> => {
  if (state.token && id) {
    try {
       const config = {
         headers: { Authorization: "Bearer " + state.token },
         responseType: "blob",
         params: { id: id }
       } as AxiosRequestConfig;

       const response = await axios.get("/api/" + route, config);
       const blob = new Blob([response.data], { type: 'application/gzip' })
       const link = document.createElement('a')
       link.href = URL.createObjectURL(blob);
       link.download = id;
       link.click();
       URL.revokeObjectURL(link.href);
   } catch (error) {
       return error;
   }
 }

}

const get = async(route: string, id: string = "", data: Object = {}): Promise<any> => {
  if (state.token) {
    try {
      // console.log("data", data);
      const config = state.token ?
      { headers: { Authorization: "Bearer " + state.token }, "params": {} }: {};

      let params = id ? { id }: {};
      config.params = {...params, ...data};

      const response = await axios.get("/api/" + route, config);
      // console.log(response.data);
      return response.data;
   } catch (error) {
       console.log("Cannot get", error);
       return error;
   }
 }
 console.log("No key. Fail.");
};

const post = async(table: string, data: Object): Promise<any> => {
  if (state.token) {
    try {
      const config = { headers: { Authorization: "Bearer " + state.token } };
      // const config = {};
      // console.log(`POST ${table}`);
      const response = await axios.post('/api/'+ table, data, config);
      // console.log("store:response", response.data);
      return response;
   } catch (error) {
     console.log("Cannot get", error);
     return error;
   }
 }
 console.log("No token. Fail.");
};

const postUnauthorized = async(table: string, data: Object): Promise<any> => {
  try {
    // console.log(`POST ${table}`);
    const response = await axios.post('/api/'+ table, data);
    console.log("postUnauthorized", table, response.data);
    return response;
 } catch (error) {
   console.log("Cannot get", error);
   return error;
 }
};

const getUser = async() => {
    if(state.token) {
      try {
        const config = { headers: { Authorization: "Bearer " + state.token }, };
        const response = await axios.get("/api/user/info", config);
        state.user = response.data;
      } catch (error) {
        console.log("Cannot get user", error)
        return error;
      }
  }
};

const deleteById = async(table: string, id: string): Promise<any> => {
  if (state.token) {
    try {
    const config = { headers: { Authorization: "Bearer " + state.token }, "params": {} };
     // if(id) { config["params"] = { id: id }; }
     // console.log("delete query", table, id);
     const response = await axios.delete("/api/" + table + "/" + id, config);
     // console.log(response.data);
     return response;
   } catch (error) {
     console.log("Cannot delete", error);
     return error;
   }
 }
 console.log("No token. Fail.");
};

export default {
  state,
  getFile,
  get,
  post,
  postUnauthorized,
  getUser,
  deleteById,
  version: project?.version,
  git: 'https' + project?.repository?.url?.slice(3, -4),
};
