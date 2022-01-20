import { v4 as uuid } from 'uuid';
import { Heap } from 'heap-js';


export type TaskId = string

export type Probability = number
export type TimeDelta = number
export type Sum = number
export type SumValues = { [k: TaskId]: Sum }

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

export class DefaultTask implements Task {
    id: TaskId
    createDate: Date;
    name: string
    isDone: boolean
    probabilitySuccess: Probability;
    estimatedTimeToCompletion: TimeDelta
    constructor(name: string, probabilitySuccess: Probability, estimatedTimeToCompletion: TimeDelta) {
        this.id = uuid()
        this.createDate = new Date()
        this.name = name
        this.isDone = false
        this.probabilitySuccess = probabilitySuccess
        this.estimatedTimeToCompletion = estimatedTimeToCompletion
    }

    Lambda(): number {
        return Math.log(1 / this.probabilitySuccess) / this.estimatedTimeToCompletion
    }
}


export interface TaskManager<T> {
    PutTask(task: Task, dependencies?: TaskId[], dependees?: TaskId[]): MaybeErr
    GetTask(taskId: TaskId): Maybe<Task>
    RemoveTask(taskId: TaskId): MaybeErr
    AddDependency(dependeeTask: TaskId, dependentTask: TaskId): MaybeErr
    RemoveDependency(dependeeTask: TaskId, dependentTask: TaskId): MaybeErr
    GetRepresentation(): T

    GetTopGoals(): TaskId[]
    GetTaskDependencies(taskId: TaskId): Result<TaskId[]>
    GetTaskDependees(taskId: TaskId): Result<TaskId[]>
    CanTaskBeDone(taskId: TaskId): Result<boolean>
    GetTaskOrdering(rootTaskId: TaskId): Result<TaskId[]>
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
            for (const d of dependencies) {
                const err = this.AddDependency(task.id, d)
                if (err != undefined) {
                    return err
                }
            }
        }

        if (dependees != undefined) {
            for (const d of dependees) {
                const err = this.AddDependency(d, task.id)
                if (err != undefined) {
                    return err
                }
            }
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

        for (const d of this.graph[taskId].dependencies) {
            const err = this.RemoveDependency(taskId, d)
            if (err != undefined) {
                return err
            }
        }

        for (const d of this.graph[taskId].dependees) {
            const err = this.RemoveDependency(d, taskId)
            if (err != undefined) {
                return err
            }
        }

        const newGraph: AdjacencyMap = {}
        for (const t in this.graph) {
            if (t !== taskId) {
                newGraph[t] = this.graph[t]
            }
        }
        this.graph = newGraph

        const newTasks: Tasks = {}
        for (const t in this.tasks) {
            if (t !== taskId) {
                newTasks[t] = this.tasks[t]
            }
        }
        this.tasks = newTasks
    }

    removeTask(taskId: TaskId, graph: AdjacencyMap): AdjacencyMap {
        this.graph[taskId].dependencies.forEach((d) => {
            graph = this.removeDependency(taskId, d, graph)
        })

        this.graph[taskId].dependees.forEach((d) => {
            graph = this.removeDependency(d, taskId, graph)
        })

        const newGraph: AdjacencyMap = {}
        for (const t in graph) {
            if (t !== taskId) {
                newGraph[t] = graph[t]
            }
        }
        graph = newGraph

        return graph
    }

    GetTask(taskId: string): Maybe<Task> {
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

        this.graph = this.removeDependency(dependeeTask, dependentTask, this.graph)

        return
    }

    removeDependency(dependeeTask: TaskId, dependentTask: TaskId, graph: AdjacencyMap): AdjacencyMap {
        graph[dependeeTask].dependencies.delete(dependentTask)

        graph[dependentTask].dependees.delete(dependeeTask)

        return graph
    }

    GetRepresentation(): AdjacencyMap {
        return this.graph
    }

    GetTopGoals(): TaskId[] {
        // tasks with no dependees
        // can cache on write/delete
        const tasks: TaskId[] = []
        for (const t in this.graph) {
            if (this.graph[t].dependees.size == 0) { // TODO filter out done
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


    GetTaskOrdering(rootTaskId: TaskId): Result<TaskId[]> {
        if (!this.doesExist(rootTaskId)) {
            return new Error(`task does exist [TaskId: ${rootTaskId}]`)
        }
        // 1. walk dag and calculate values
        const sumValues = this.calculateGraphSums(rootTaskId)
        // 2. priority Q
        // - put leaves in Q
        // - pop off highest value and add to topoplogical ordering list
        // - put new leaves in Q 
        // - repeat til no more nodes
        const comp = (a: TaskId, b: TaskId) => sumValues[a] - sumValues[b]
        const heap = new Heap<TaskId>(comp);

        const leaves = this.getDependencyLeaves(rootTaskId)

        leaves.forEach((l) => {
            heap.push(l)
        })

        let graph: AdjacencyMap = { ...this.graph }
        const tasks: TaskId[] = []
        while (!heap.isEmpty()) {
            const task = heap.pop()
            if (task == undefined) {
                // maybe return an error?
                break
            }
            tasks.push(task)

            const newLeaves = this.getPotentialNewLeaves(task, graph)
            newLeaves.forEach((l) => {
                heap.push(l)
            })

            graph = this.removeTask(task, graph)
        }


        return tasks
    }

    getPotentialNewLeaves(taskId: TaskId, graph: AdjacencyMap): TaskId[] {
        const newLeaves: TaskId[] = []
        graph[taskId].dependees.forEach((t) => {
            if (graph[t].dependencies.size == 1 && graph[t].dependencies.has(taskId)) { // second part of check may not be necesssary
                newLeaves.push(t)
            }
        })
        return newLeaves
    }

    calculateGraphSums(rootTaskId: TaskId): SumValues {
        let sumValues = {}
        this.dependentDfsSum(rootTaskId, 0, sumValues)
        return sumValues
    }

    dependentDfsSum(taskId: TaskId, currSum: Sum, values: SumValues): void {
        const task = this.tasks[taskId]
        const newSum = task.Lambda() + currSum
        if (taskId in values) {
            values[taskId] += newSum
        } else {
            values[taskId] = newSum
        }

        this.graph[taskId].dependencies.forEach((t) => {
            this.dependentDfsSum(t, newSum, values)
        })

        return
    }

    getDependencyLeaves(taskId: TaskId): Set<TaskId> {
        if (this.graph[taskId].dependencies.size == 0) {
            return new Set([taskId])
        }
        let tasks: Set<TaskId> = new Set()
        this.graph[taskId].dependencies.forEach(
            (task) => {
                const lt = this.getDependencyLeaves(task)
                lt.forEach((l) => tasks.add(l))
            }
        )
        return tasks
    }

    CanTaskBeDone(taskId: TaskId): Result<boolean> {
        if (!this.doesExist(taskId)) {
            return new Error(`task does exist [TaskId: ${taskId}]`)
        }
        return this.graph[taskId].dependencies.size == 0
    }

}
