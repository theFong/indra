export type TaskId = string

export type Probability = number
export type TimeDelta = number

export type Maybe<T> = T | undefined
export type MaybeErr = Maybe<Error>
export type Result<T> = T | Error

export interface Task {
    id: TaskId
    createDate: Date
    name: string
    isDone: boolean
    probabilitySuccess: Probability
    estimatedTimeToCompletion: TimeDelta
    Lambda(): number
}


export interface TaskManager<T> {
    PutTask(task: Task, dependencies?: TaskId[], dependees?: TaskId[]): MaybeErr
    GetTask(taskId: TaskId): Result<Task>
    RemoveTask(taskId: TaskId): MaybeErr
    AddDependency(dependeeTask: TaskId, dependentTask: TaskId): MaybeErr
    RemoveDependency(dependeeTask: TaskId, dependentTask: TaskId): MaybeErr
    GetRepresentation(): T

    GetTopGoals(): TaskId[]
    GetTaskDependencies(taskId: TaskId): Result<TaskId[]>
    GetTaskDependees(taskId: TaskId): Result<TaskId[]>
    GetTodoTasks(rootTaskId: TaskId): Result<TaskId[]>
}

type Dependencies = Set<TaskId>
type Dependees = Set<TaskId>
type Connections = { dependencies: Dependencies, dependees: Dependees }
export interface AdjacencyMap {
    [k: TaskId]: Connections
}

type Tasks = { [k: TaskId]: Task }

export class DefaultTaskManager implements TaskManager<AdjacencyMap> {
    graph: AdjacencyMap
    tasks: Tasks
    constructor() {
        this.graph = {}
        this.tasks = {}
    }
    PutTask(task: Task, dependencies?: TaskId[], dependees?: TaskId[]): MaybeErr {
        // not idempotent if fails
        this.tasks[task.id] = task

        if (!(task.id in this.graph)) {
            this.graph[task.id] = {
                dependees: new Set(),
                dependencies: new Set()
            }
        }

        if (dependencies != undefined) {
            dependencies.forEach(d => {
                const err = this.AddDependency(task.id, d)
                if (err != undefined) {
                    return err
                }
            });
        }

        if (dependees != undefined) {
            dependees.forEach(d => {
                const err = this.AddDependency(d, task.id)
                if (err != undefined) {
                    return err
                }
            })

        }
        return
    }

    doesExist(taskId: TaskId): boolean {
        return taskId in this.tasks
    }

    RemoveTask(taskId: TaskId): MaybeErr {
        // not idempotent if fails
        if (!this.doesExist(taskId)) {
            return new Error(`task does not exist [TaskId: ${taskId}]`)
        }

        for (const d in this.graph[taskId].dependencies) {
            const err = this.RemoveDependency(taskId, d)
            if (err != undefined) {
                return err
            }
        }

        for (const d in this.graph[taskId].dependees) {
            const err = this.RemoveDependency(d, taskId)
            if (err != undefined) {
                return err
            }
        }

        const newTasks: Tasks = {}
        for (const t in this.tasks) {
            if (t !== taskId) {
                newTasks[t] = this.tasks[t]
            }
        }
    }

    GetTask(taskId: string): Result<Task> {
        return this.tasks[taskId]
    }

    AddDependency(dependeeTask: string, dependentTask: string,): MaybeErr {
        // TODO check and prevent if creates cycle?
        if (!this.doesExist(dependeeTask)) {
            return new Error(`dependee task does exist [TaskId: ${dependeeTask}]`)
        }

        if (!this.doesExist(dependentTask)) {
            return new Error(`dependent task does exist [TaskId: ${dependentTask}]`)
        }

        this.graph[dependeeTask].dependencies.add(dependentTask)
        this.graph[dependentTask].dependees.add(dependeeTask)

        return
    }

    RemoveDependency(dependeeTask: TaskId, dependentTask: TaskId): MaybeErr {
        if (!this.doesExist(dependeeTask)) {
            return new Error(`dependee task does exist [TaskId: ${dependeeTask}]`)
        }

        if (!this.doesExist(dependentTask)) {
            return new Error(`dependent task does exist [TaskId: ${dependentTask}]`)
        }

        this.graph[dependeeTask].dependencies.delete(dependentTask)

        this.graph[dependentTask].dependees.delete(dependeeTask)

        return
    }

    GetRepresentation(): AdjacencyMap {
        return this.graph
    }

    GetTopGoals(): TaskId[] {
        // tasks with no dependees
        // can cache on write/delete
        const tasks: TaskId[] = []
        for (const t in this.graph) {
            if (Object.keys(this.graph[t].dependees).length == 0) {
                tasks.push(t)
            }
        }
        return tasks
    }

    GetTaskDependencies(taskId: TaskId): Result<TaskId[]> {
        if (!this.doesExist(taskId)) {
            return new Error(`task does exist [TaskId: ${taskId}]`)
        }
        return Array.from(this.graph[taskId].dependencies.values())
    }

    GetTaskDependees(taskId: TaskId): Result<TaskId[]> {
        if (!this.doesExist(taskId)) {
            return new Error(`task does exist [TaskId: ${taskId}]`)
        }
        return Array.from(this.graph[taskId].dependees.values())
    }

    GetTodoTasks(rootTaskId: TaskId): Result<TaskId[]> {
        if (!this.doesExist(rootTaskId)) {
            return new Error(`task does exist [TaskId: ${rootTaskId}]`)
        }
        // traverse dependencies & get leaf nodes
        // can cache on write/delete
        // recurse search get leaf
        // should return as toplogical ordering???

        let tasks: Set<TaskId> = new Set()
        for (const t in this.graph[rootTaskId].dependencies) {
            const lt = this.getDependencyLeaf(t)
            lt.forEach((l) => tasks.add(l))
        }
        return Array.from(tasks.values())
    }

    getDependencyLeaf(taskId: TaskId): Set<TaskId> {
        if (Object.keys(this.graph[taskId].dependencies).length == 0) {
            return new Set([taskId])
        }
        let tasks: Set<TaskId> = new Set()
        for (const t in this.graph[taskId].dependencies) {
            const lt = this.getDependencyLeaf(t)
            lt.forEach((l) => tasks.add(l))
        }
        return tasks
    }
}
