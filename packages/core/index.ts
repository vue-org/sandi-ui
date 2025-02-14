import { getCurrentInstance, provide, inject } from 'vue';
import type { ComponentInternalInstance } from 'vue'
import { Scene, Mesh, Object3D, WebGLRenderer, Material, Loader, BufferGeometry, EventDispatcher } from "three"
import type { Event } from 'three'
import { UID, RENDER_ID, SCENE_ID } from "@sandi-ui/constants"
type ThreeType = Scene | Mesh | Object3D | WebGLRenderer | Material | Loader | BufferGeometry | any
interface v3dNode<T> {
    parent: number | undefined, // 父级 ID
    children: number[] | undefined, // 子集 ID
    node: T, // 当前节点实例
    id: number,
}
// 3D tree
export default class v3dCore extends EventDispatcher {
    private map = new Map<number, v3dNode<ThreeType>>();
    addNode<T>(node: ThreeType) {
        const ComponentInstance = getCurrentInstance() as ComponentInternalInstance;
        const id = ComponentInstance!.uid;
        if (node instanceof WebGLRenderer) {
            // provide render id
            provide(RENDER_ID, id)
        }
        if (node instanceof Scene && node.isScene) {
            // provide scene id
            provide(SCENE_ID, id)
        }
        // provide parent id
        provide(UID, id);
        const parentId = inject<number | undefined>(UID)
        if (parentId) {
            const node = this.map.get(parentId)
            if (node) {
                node.children ? node.children.push(id) : node.children = [id]
            }
        }
        this.map.set(id, { id, parent: parentId, children: undefined, node })
        return { parentId, id }
    }
    addNodeWithId<T>(node: ThreeType, parentId: number, id: number) {
        if (parentId) {
            const node = this.map.get(parentId)
            if (node) {
                node.children ? node.children.push(id) : node.children = [id]
            }
        }
        this.map.set(id, { id, parent: parentId, children: undefined, node })
        return { parentId, id }
    }
    setNode(id: number, newNode: ThreeType) {
        const { parent, children, node: oldNode } = this.map.get(id) as v3dNode<ThreeType>;
        // const node = {...oldNode,...newNode} as ThreeType
        this.map.set(id, { id, parent, children, node: newNode })
    }
    delNode(id: number) {
        const node = this.map.get(id);
        if (node?.parent) {
            const parent = this.map.get(node.parent)
            // 判断是否有 子节点
            if (parent?.children) {
                // 移除数组
                const children = parent.children.filter(childrenId => childrenId != id);
                if (children.length > 0) {
                    parent.children = children
                } else {
                    parent.children = undefined
                }
            }
        }
        this.map.delete(id)
    }
    getParentAndId(): { parentId: number | undefined, id: number } {
        const ComponentInstance = getCurrentInstance() as ComponentInternalInstance;
        const id = ComponentInstance!.uid;
        return {
            parentId: inject<number | undefined>(UID),
            id
        }
    }
    getNode<T = any>(id: number): v3dNode<T> {
        return this.map.get(id) as any as v3dNode<T>
    }
    getChildrens(parentId: number): v3dNode<ThreeType>[] {
        const parentNode = this.map.get(parentId);
        if (parentNode) {
            if (parentNode.children) {
                return parentNode.children.map(childrenItem => {
                    const childrenNode = this.map.get(childrenItem)
                    if (childrenNode && childrenNode.children) {
                        return this.getChildrens(childrenNode.id).concat(childrenNode)
                    } else {
                        return [childrenNode]
                    }
                }).flat() as v3dNode<ThreeType>[]
            } else {
                return [parentNode]
            }
        } else {
            return []
        }

    }
    getParent<T>(): v3dNode<T> | undefined {
        const parentId = inject<number | undefined>(UID)
        if (parentId) {
            return this.map.get(parentId) as any as v3dNode<T>
        } else {
            return undefined
        }
    }
    addEventListenerById(id: number, type: string, fn: (event: Event) => void) {
        this.addEventListener(`${type}-${id}`, fn)
    }
    dispatchEventById(id: number, event: Event): void {
        const { type: oldType } = event;
        this.dispatchEvent({ ...event, type: `${oldType}-${id}` })
    }
}
