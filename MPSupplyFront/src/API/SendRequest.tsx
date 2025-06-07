import axios from "axios";
import { toast } from "react-toastify";

export const sendReq = async (
    url: string,
    type: string = "GET",
    params: any = null
  ) => {
    try {
      switch (type) {
        case "GET":
          return (await axios.get(url, {params: params})).data;
        case "POST":
          return (await axios.post(url, params)).data;
        case "PUT":
          return (await axios.put(url, params)).data;
        case "PATCH":
          return (await axios.patch(url, params)).data;
        case "DELETE":
          return (await axios.delete(url)).data;
        case "POST_FILE":
          return (await axios.post(url, params, {headers: {'Content-Type': 'multipart/form-data'}})).data;
        default:
          throw new Error("Не валидный тип запроса");
      }
    } catch (e: any) {
      if (e.response) {
        if (e.response.status == 500 || e.response.status == 502) {
          toast.error("Ошибка сервера");
          return { error: "Ошибка сервера" };
        } else if (e.response.status == 403 && e.response.data.message == 'Forbidden resource') {
          toast.error('Недостаточно прав');
          return { error: 'Недостаточно прав' };
        } else {
          if (Array.isArray(e.response.data.message)) {
            toast.error(e.response.data.message[0]);
            return { error: e.response.data.message[0] };
          } else {
            toast.error(e.response.data.message);
            return { error: e.response.data.message };
          }
        }
      }

      if (e.message && e.message != "") {
        toast.error(e.message);
        return { error: e.message };
      }
    }
  };