export type TaskId = string

export type Probability = number
export type TimeDelta = number

export type Maybe<T> = T | undefined
export type MaybeErr = Maybe<Error>

export interface Task {
    id: TaskId
    name: string
    probabilitySuccess: Probability
    estimatedTimeToCompletion: TimeDelta
}

export type Result<T> = T | Error

export interface TaskManager<T> {
    PutTask(task: Task, dependencies?: TaskId[], dependees?: TaskId[]): MaybeErr
    GetTask(taskId: TaskId): Result<Task>
    RemoveTask(taskId: TaskId): MaybeErr
    AddDependency(dependeeTask: TaskId, dependentTask: TaskId): MaybeErr
    RemoveDependency(dependeeTask: TaskId, dependentTask: TaskId): MaybeErr
    GetRepresentation(): T
}

type Dependencies = { [k: TaskId]: boolean }
type Dependees = { [k: TaskId]: boolean }
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
                dependees: {},
                dependencies: {}
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
        if (!this.doesExist(dependeeTask)) {
            return new Error(`dependee task does exist [TaskId: ${dependeeTask}]`)
        }

        if (!this.doesExist(dependentTask)) {
            return new Error(`dependent task does exist [TaskId: ${dependentTask}]`)
        }

        this.graph[dependeeTask].dependencies[dependentTask] = true
        this.graph[dependentTask].dependees[dependeeTask] = true

        return
    }

    RemoveDependency(dependeeTask: TaskId, dependentTask: TaskId): MaybeErr {
        if (!this.doesExist(dependeeTask)) {
            return new Error(`dependee task does exist [TaskId: ${dependeeTask}]`)
        }

        if (!this.doesExist(dependentTask)) {
            return new Error(`dependent task does exist [TaskId: ${dependentTask}]`)
        }

        const newDependencies: Dependencies = {}
        for (const t in this.graph[dependeeTask].dependencies) {
            if (t !== dependentTask) {
                newDependencies[t] = true
            }
        }
        this.graph[dependeeTask].dependencies = newDependencies

        const newDependees: Dependees = {}
        for (const t in this.graph[dependentTask].dependees) {
            if (t !== dependeeTask) {
                newDependees[t] = true
            }
        }
        this.graph[dependentTask].dependees = newDependees

        return
    }

    GetRepresentation(): AdjacencyMap {
        return this.graph
    }
}