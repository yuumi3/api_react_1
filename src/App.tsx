import React, { useEffect, useState } from 'react'
import { useForm } from "react-hook-form"
import 'bulma/css/bulma.css'

type TodoType = {
  id: number
  due: string
  task: string
  user_id: number
}
type NewTodoType = {
  due: string
  task: string
  user_id: number
}

type SessionType = {
  id: number
  token: string
} | null

const BackendURL = "http://localhost:3000"

const backendAPI = async (method: string, path: string, token?: string, body?: string): Promise<Response> => {
  const headers:HeadersInit = token ? {"content-type": "application/json", "Authorization": `Token ${token}`} : {"content-type": "application/json"}

  const response = await fetch(`${BackendURL}/${path}`, {method, mode: "cors", headers, body})
  if (!response.ok) {
    console.log('** error **', response)
  }
  return response
}

const backendGetTodos = async (session: SessionType): Promise<TodoType[]> => {
  if (session === null) { return [] }

  const response = await backendAPI("GET", "todos", session.token)
  if (!response.ok) { return [] }

  const todos = await response.json()
  console.log("----", todos)
  return todos
}

const backendPostTodo = async (session: SessionType, todo: NewTodoType): Promise<void> => {
  if (session === null) { return }

  const response = await backendAPI("POST", "todos", session.token, JSON.stringify({todo: todo}))
  if (!response.ok) { return }
  const result = await response.json()
  console.log("----", result)
}

const backendPutTodo = async (session: SessionType, todo: TodoType): Promise<void> => {
  if (session === null) { return }

  const response = await backendAPI("PUT", `todos/${todo.id}`, session.token, JSON.stringify({todo: todo}))
  if (!response.ok) { return }
  const result = await response.json()
  console.log("----", result)
}

const backendDeleteTodo = async (session: SessionType, todo: TodoType): Promise<void> => {
  if (session === null) { return }

  const response = await backendAPI("DELETE", `todos/${todo.id}`, session.token)
  if (!response.ok) { return }
  console.log("---- OK")
}

const backendPostLogin = async (email: string, password: string): Promise<SessionType> => {
  const response = await backendAPI("POST", "logins", undefined, JSON.stringify({email: email, password: password}))
  if (!response.ok) { return null }

  const result = await response.json()
  console.log("----", result)
  if (result.auth) {
    return {id: result.id, token: result.token}
  } else {
    return null
  }
}

type PageStateType = "list" | "edit" | "add" | "login"
type EditTodoType = TodoType | null
type AddTodoType = NewTodoType | null

// -----------------------------------------------------

export const App: React.FC = () => {
  const [todos, setTodos] = useState<TodoType[]>([])
  const [editTodo, setEditTodo] = useState<EditTodoType>(null)
  const [pageState, setPageState] = useState<PageStateType>("login")
  const [session, setSession] = useState<SessionType>(null)
  const [loginFailed, setLoginFailed] = useState(false)

  useEffect(() => {(async () => setTodos(await backendGetTodos(session)))()}, [session])

  const editExec = (todo: TodoType) => {
    setPageState("edit")
    setEditTodo(todo)
  }
  const editDone = (newTodo: EditTodoType) => {
    console.log("== update ", newTodo)
    if (newTodo) {(async () => {
        await backendPutTodo(session, newTodo)
        setTodos(await backendGetTodos(session))
      })()
    }
    setPageState("list")
  }
  const addExec = () => {
    setPageState("add")
  }
  const addDone = (newTodo: AddTodoType) => {
    console.log("== add ", newTodo)
    if (newTodo) {(async () => {
        await backendPostTodo(session, newTodo)
        setTodos(await backendGetTodos(session))
      })()
    }
    setPageState("list")
  }
  const deleteExec = (todo: TodoType) => {
    console.log("== delete ", todo.id);
    (async () => {
        await backendDeleteTodo(session, todo)
        setTodos(await backendGetTodos(session))
      })()
  }
  const loginExec = (email: string, password: string) => {
    console.log("== login ", email);

    (async () => {
      const login = await backendPostLogin(email, password)
      if (login) {
        setSession(login)
        setPageState("list")
        setLoginFailed(false)
      } else {
        setLoginFailed(true)
      }
    })()
  }
  const logoutExec = () => {
    setSession(null)
    setPageState("login")
  }

  return (
    <>
     <div className="container">
      <section className="hero is-info is-small" style={{background: "linear-gradient(to right, #5B86E5, #36D1DC)"}}>
        <div className="hero-body">
        <p className="title">Todo</p>
        </div>
      </section>
      <section className="section pt-5">
        {pageState === "login" &&  <Login loginExec={loginExec} loginFailed={loginFailed}/>}
        {pageState === "edit" && editTodo && <EditTodo todo={editTodo} editDone={editDone} />}
        {pageState === "add" && session && <AddTodo userId={session?.id} addDone={addDone} />}
        {pageState === "list" &&
        <div>
          <h1 className="title is-4">リスト</h1>
          <TodoList todos={todos} editExec={editExec} deleteExec={deleteExec} />
          <div className="buttons">
            <button onClick={() => addExec()} className="button is-primary">追加</button>
            <button onClick={() => logoutExec()} className="button is-warning">ログアウト</button>
          </div>
        </div>}
      </section>
    </div>
    </>
  )
}

type TodoListProps = {
  todos: TodoType[]
  editExec: (todo: TodoType) => void
  deleteExec: (todo: TodoType) => void
}
const TodoList: React.FC<TodoListProps> = ({todos, editExec, deleteExec}) => {
  return (
    <table className="table is-striped">
      <thead>
        <tr>
          <th>期日</th><th>タスク</th><th></th>
        </tr>
      </thead>
      <tbody>
      {todos.map((todo, ix) => <TodoItem  key={ix} todo={todo}
        editExec={editExec} deleteExec={deleteExec} />)}
      </tbody>
    </table>
  )
}

type TodoItemProps = {
  todo: TodoType
  editExec: (todo: TodoType) => void
  deleteExec: (todo: TodoType) => void
}
const TodoItem: React.FC<TodoItemProps> = ({todo, editExec, deleteExec}) => {
  return (
    <tr>
      <td>{todo.due}</td>
      <td>{todo.task}</td>
      <td>
        <div className="buttons are-small">
          <button onClick={() => editExec(todo)} className="button is-primary">編集</button>
          <button onClick={() => deleteExec(todo)} className="button is-danger">削除</button>
        </div>
      </td>
    </tr>
  )
}

type TodoFormProps = {
  title: string
  todo: TodoType
  done: (newTodo: EditTodoType) => void
}
const TodoForm: React.FC<TodoFormProps> = ({title, todo, done}) => {
  type TodoInputs = {
    due: string,
    task: string,
  }
  const { register, handleSubmit, errors } = useForm<TodoInputs>({defaultValues: {
    due: todo.due,
    task: todo.task
  }});
  const onSubmit = (data:TodoInputs) => { done({...todo, due: data.due, task: data.task}) }

  return (
    <div className="box">
      <h2 className="title is-4">{title}</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label className="label">期日</label>
          <div className="control">
            <input className="input" type="text" name="due"
              ref={register({ required: "期日を入力して下さい",
                    pattern: { value: /^\d\d\d\d-\d\d-\d\d$/,
                                message: "期日が正しくありません" }})} />
          </div>
        </div>
        <div className="field">
          <label className="label">タスク</label>
          <div className="control">
          <input className="input" type="text" name="task"
              ref={register({ required: "タスクを入力して下さい" })} />
          </div>
        </div>

        {Object.keys(errors).length > 0 &&
        <div className="notification is-danger">
          <p>{errors.due?.message}</p>
          <p>{errors.task?.message}</p>
        </div>}

        <div className="field is-grouped mt-5">
          <div className="control">
            <button className="button is-primary"  type="submit">{title}</button>
          </div>
          <div className="control">
            <button className="button"
              onClick={() => done(null)}>キャンセル</button>
          </div>
        </div>
      </form>
    </div>
  )
}


type EditTodoProps = {
  todo: TodoType
  editDone: (newTodo: EditTodoType) => void
}
const EditTodo: React.FC<EditTodoProps> = ({todo, editDone}) => {
  return <TodoForm title="編集" todo={todo} done={editDone}/>
}


type AddTodoProps = {
  userId: number
  addDone: (newTodo: AddTodoType) => void
}
const AddTodo: React.FC<AddTodoProps> = ({userId, addDone}) => {
  return <TodoForm title="追加" todo={{id: 0, due: "2021-02-06", task: "", user_id: userId}} done={addDone}/>
}

type LoginProps ={
  loginExec: (email: string, passwprd: string) => void
  loginFailed: boolean
}
const Login: React.FC<LoginProps> = ({loginExec, loginFailed}) => {
  type LoginInputs = {
    email: string,
    password: string,
  }
  const { register, handleSubmit, errors } = useForm<LoginInputs>({defaultValues: {
    email: "yama@rails.com",
    password: "test1"
  }});
  const onSubmit = (data:LoginInputs) => {loginExec(data.email, data.password)}

  return (
    <div className="box">
      <h2 className="title is-4">ログイン</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="field">
          <label className="label">メールアドレス</label>
          <div className="control">
            <input className="input" type="text" name="email"
              ref={register({ required: "メールアドレスを入力して下さい" })} />
          </div>
        </div>
        <div className="field">
          <label className="label">パスワード</label>
          <div className="control">
            <input className="input" type="password" name="password"
              ref={register({ required: "パスワードを入力して下さい" })} />
          </div>
        </div>

        {Object.keys(errors).length > 0 &&
        <div className="notification is-danger">
          <p>{errors.email?.message}</p>
          <p>{errors.password?.message}</p>
        </div>}
        {loginFailed &&
        <div className="notification is-danger">
           <p>{"メールアドレスまたはパスワードが正しくありません"}</p>
        </div>}

        <div className="field mt-5">
          <div className="control">
            <button className="button is-primary" type="submit">ログイン</button>
          </div>
        </div>
      </form>
    </div>
  )
}