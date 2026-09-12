import cookies from 'react-cookies'

const MyUserReducer = (currentState, action) => {
    switch (action.type) {


        case "LOGIN":
            return action.payload;

        case "LOGOUT":

            cookies.remove("user", { path: "/" });
            cookies.remove("jwt_token", { path: "/" });
            return null;

        default:
            return currentState;
    }
};

export default MyUserReducer;