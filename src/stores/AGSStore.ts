export class StoreValue<TStored, TSetter> {
	value: TStored;
	setter: (v: TSetter) => void;

	constructor(value: TStored, setter: (v: TSetter) => void) {
		this.value = value;
		this.setter = setter;
	}

	getValue(): TStored {
		return this.value;
	}
	getSetter(): (v: TSetter) => void {
		return this.setter;
	}
}

export interface Store
	<
		A extends Record<string, any>, // Actual stored value type
		B extends { [K in keyof A]: any } // Type of value passed to setter
	> {
	store: { [K in keyof A]: StoreValue<A[K], B[K]> };

	getValue<K extends keyof A>(key: K): A[K] | undefined;
	getSetter<K extends keyof A>(key: K): ((v: B[K]) => void) | undefined;
	setValue<K extends keyof A>(key: K, value: B[K]): void;
}


export class DefaultStore<
	A extends Record<string, any>,
	B extends { [K in keyof A]: any }
> implements Store<A, B> {

	store: { [K in keyof A]: StoreValue<A[K], B[K]> };

	constructor(values: A, setters: B) {
		this.store = {} as any;
		(Object.keys(values) as (keyof A)[]).forEach((key) => {
			this.store[key] = new StoreValue(values[key], setters[key]);
		});
	}

	getValue<K extends keyof A>(key: K): A[K] {
		return this.store[key]?.getValue();
	}

	getSetter<K extends keyof A>(key: K): (v: B[K]) => void {
		return this.store[key]?.getSetter();
	}

	setValue<K extends keyof A>(key: K, value: B[K]): void {
		this.getSetter(key)(value);
	}
}

