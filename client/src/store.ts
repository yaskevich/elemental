import { reactive } from "vue";
import axios from "axios";
// import project from '../../package.json';

const state = reactive({
  token: localStorage.getItem('token') || '',
  user: { text_id: localStorage.getItem('text_id') || null, },
  error: "",
});

const get = async(route: string, id?: string): Promise<any> => {
  // if (state.key) {
    try {
      const config = {};
       // const config = state.key ?
       // { headers: { Authorization: "Bearer " + state.key }, "params": {} }: {};

       if(id) {
          config["params"] = { id: id };
       }

       const response = await axios.get("/api/" + route, config);
       // console.log(response.data);
       return response.data;
   } catch (error) {
       console.log("Cannot get", error);
       return error;
   }
 // }
 // console.log("No key. Fail.");
};

const post = async(table: string, data: Object): Promise<any> => {
  // if (state.token) {
    try {
      // const config = { headers: { Authorization: "Bearer " + state.token } };
      const config = {};
      // console.log(`POST ${table}`);
      const response = await axios.post('/api/'+ table, data, config);
      // console.log("store:response", response.data);
      return response;
   } catch (error) {
     console.log("Cannot get", error);
     return error;
   }
 // }
 console.log("No token. Fail.");
};

const getUser = async() => {
    if(state.token) {
      try {
        const config = { headers: { Authorization: "Bearer " + state.token }, };
        const response = await axios.get("/api/user/info", config);
        state.user = {...state.user, ...response.data};
      } catch (error) {
        console.log("Cannot get user", error)
        return error;
      }
  }
};

export default {
  state,
  get,
  post,
  getUser,
  // state: state,
  // version: project.version,
};
