// import { reactive } from "vue";
import axios from "axios";
// import project from '../../package.json';

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

export default {
  get,
  // state: state,
  // version: project.version,
};
