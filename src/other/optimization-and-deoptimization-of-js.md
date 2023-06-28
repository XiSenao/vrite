# JS的优化和去优化

JavaScript 是弱类型语言，不会像强类型语言那样需要限定函数调用的形参数据类型，而是可以非常灵活的传入各种类型的参数进行处理，如下所示：

```javascript
function add(x, y) { 
    // + 操作符是 JavaScript 中非常复杂的一个操作
    return x + y
}

add(1, 2);
add('1', 2);
add(null, 2);
add(undefined, 2);
add([], 2);
add({}, 2);
add([], {});
```

为了可以进行 + 操作符运算，在底层执行的时候往往需要调用很多 API，比如 ToPrimitive（判断是否是对象）、ToString、ToNumber 等，将传入的参数进行符合 + 操作符的数据转换处理。

在这里 `V8` 会对 `JavaScript` 像强类型语言那样对形参 `x` 和 `y` 进行推测，这样就可以在运行的过程中排除一些 **副作用分支** 代码，同时这里也会预测代码不会抛出异常，因此可以对代码进行优化，从而达到最高的运行性能。在 `Ignition` 中通过字节码来收集反馈信息（**Feedback Vector**），如下所示：
![](https://p9-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f10b9601ad0941afb5adb8c2c5409081~tplv-k3u1fbpfcp-zoom-in-crop-mark:4536:0:0:0.awebp?)

为了查看 add 函数的运行时反馈信息，我们可以通过 V8 提供的 Native API 来打印 add 函数的运行时信息，具体如下所示：

```javascript
function add(x, y) {
    return x + y
}

// 注意这里默认采用了 ClosureFeedbackCellArray，为了查看效果，强制开启 FeedbackVector
// 更多信息查看： A lighter V8：https://v8.dev/blog/v8-lite
%EnsureFeedbackVectorForFunction(add);
add(1, 2);
// 打印 add 详细的运行时信息
%DebugPrint(add);
```

通过 **`--allow-natives-syntax`** 参数可以在 JavaScript 中调用 **`%DebugPrint`** 底层 Native API（更多 API 可以查看 V8 的 [runtime.h](https://github.com/v8/v8/blob/main/src/runtime/runtime.h) 头文件）：

```yaml
v8-debug --allow-natives-syntax  ./index.js

DebugPrint: 0x1d22082935b9: [Function] in OldSpace
 - map: 0x1d22082c2281 <Map(HOLEY_ELEMENTS)> [FastProperties]
 - prototype: 0x1d2208283b79 <JSFunction (sfi = 0x1d220820abbd)>
 - elements: 0x1d220800222d <FixedArray[0]> [HOLEY_ELEMENTS]
 - function prototype: 
 - initial_map: 
 - shared_info: 0x1d2208293491 <SharedFunctionInfo add>
 - name: 0x1d2208003f09 <String[3]: #add>
 // 包含 Ignition 解释器的 trampoline 指针
 - builtin: InterpreterEntryTrampoline
 - formal_parameter_count: 2
 - kind: NormalFunction
 - context: 0x1d2208283649 <NativeContext[263]>
 - code: 0x1d2200005181 <Code BUILTIN InterpreterEntryTrampoline>
 - interpreted
 - bytecode: 0x1d2208293649 <BytecodeArray[6]>
 - source code: (x, y) {
    return x + y
}
 - properties: 0x1d220800222d <FixedArray[0]>
 - All own properties (excluding elements): {
    0x1d2208004bb5: [String] in ReadOnlySpace: #length: 0x1d2208204431 <AccessorInfo> (const accessor descriptor), location: descriptor
    0x1d2208004dfd: [String] in ReadOnlySpace: #name: 0x1d22082043ed <AccessorInfo> (const accessor descriptor), location: descriptor
    0x1d2208003fad: [String] in ReadOnlySpace: #arguments: 0x1d2208204365 <AccessorInfo> (const accessor descriptor), location: descriptor
    0x1d22080041f1: [String] in ReadOnlySpace: #caller: 0x1d22082043a9 <AccessorInfo> (const accessor descriptor), location: descriptor
    0x1d22080050b1: [String] in ReadOnlySpace: #prototype: 0x1d2208204475 <AccessorInfo> (const accessor descriptor), location: descriptor
 }

 // 以下是详细的反馈信息 
 - feedback vector: 0x1d2208293691: [FeedbackVector] in OldSpace
 - map: 0x1d2208002711 <Map>
 - length: 1
 - shared function info: 0x1d2208293491 <SharedFunctionInfo add>
 - no optimized code
 - optimization marker: OptimizationMarker::kNone
 - optimization tier: OptimizationTier::kNone
 - invocation count: 0
 - profiler ticks: 0
 - closure feedback cell array: 0x1d22080032b5: [ClosureFeedbackCellArray] in ReadOnlySpace
 - map: 0x1d2208002955 <Map>
 - length: 0

 - slot #0 BinaryOp BinaryOp:None {
     [0]: 0
  }
0x1d22082c2281: [Map]
 - type: JS_FUNCTION_TYPE
 - instance size: 32
 - inobject properties: 0
 - elements kind: HOLEY_ELEMENTS
 - unused property fields: 0
 - enum length: invalid
 - stable_map
 - callable
 - constructor
 - has_prototype_slot
 - back pointer: 0x1d22080023b5 <undefined>
 - prototype_validity cell: 0x1d22082044fd <Cell value= 1>
 - instance descriptors (own) #5: 0x1d2208283c29 <DescriptorArray[5]>
 - prototype: 0x1d2208283b79 <JSFunction (sfi = 0x1d220820abbd)>
 - constructor: 0x1d2208283bf5 <JSFunction Function (sfi = 0x1d220820acb9)>
 - dependent code: 0x1d22080021b9 <Other heap object (WEAK_FIXED_ARRAY_TYPE)>
 - construction counter: 0
```

为了使得 add 函数可以像 HotSpot 代码一样被优化，在这里强制做一次函数优化：

```javascript
function add(x, y) {
    return x + y
}

add(1, 2);
// 强制开启函数优化
%OptimizeFunctionOnNextCall(add);
%EnsureFeedbackVectorForFunction(add);
add(1, 2);
// 打印 add 详细的运行时信息
%DebugPrint(add);
```

通过 --trace-opt 参数可以跟踪 add 函数的编译优化信息：

```yaml
 v8-debug --allow-natives-syntax --trace-opt  ./index.js

[manually marking 0x3872082935bd <JSFunction add (sfi = 0x3872082934b9)> for non-concurrent optimization]
// 这里使用 TurboFan 优化编译器对 add 函数进行编译优化
[compiling method 0x3872082935bd <JSFunction add (sfi = 0x3872082934b9)> (target TURBOFAN) using TurboFan]
[optimizing 0x3872082935bd <JSFunction add (sfi = 0x3872082934b9)> (target TURBOFAN) - took 0.097, 2.003, 0.273 ms]
DebugPrint: 0x3872082935bd: [Function] in OldSpace
 - map: 0x3872082c2281 <Map(HOLEY_ELEMENTS)> [FastProperties]
 - prototype: 0x387208283b79 <JSFunction (sfi = 0x38720820abbd)>
 - elements: 0x38720800222d <FixedArray[0]> [HOLEY_ELEMENTS]
 - function prototype: 
 - initial_map: 
 - shared_info: 0x3872082934b9 <SharedFunctionInfo add>
 - name: 0x387208003f09 <String[3]: #add>
 - formal_parameter_count: 2
 - kind: NormalFunction
 - context: 0x387208283649 <NativeContext[263]>
 - code: 0x387200044001 <Code TURBOFAN>
 - source code: (x, y) {
    return x + y
}
 - properties: 0x38720800222d <FixedArray[0]>
 - All own properties (excluding elements): {
    0x387208004bb5: [String] in ReadOnlySpace: #length: 0x387208204431 <AccessorInfo> (const accessor descriptor), location: descriptor
    0x387208004dfd: [String] in ReadOnlySpace: #name: 0x3872082043ed <AccessorInfo> (const accessor descriptor), location: descriptor
    0x387208003fad: [String] in ReadOnlySpace: #arguments: 0x387208204365 <AccessorInfo> (const accessor descriptor), location: descriptor
    0x3872080041f1: [String] in ReadOnlySpace: #caller: 0x3872082043a9 <AccessorInfo> (const accessor descriptor), location: descriptor
    0x3872080050b1: [String] in ReadOnlySpace: #prototype: 0x387208204475 <AccessorInfo> (const accessor descriptor), location: descriptor
 }
 - feedback vector: 0x387208293685: [FeedbackVector] in OldSpace
 - map: 0x387208002711 <Map>
 - length: 1
 - shared function info: 0x3872082934b9 <SharedFunctionInfo add>
 - no optimized code
 - optimization marker: OptimizationMarker::kNone
 - optimization tier: OptimizationTier::kNone
 // 调用次数增加了 1 次
 - invocation count: 1
 - profiler ticks: 0
 - closure feedback cell array: 0x3872080032b5: [ClosureFeedbackCellArray] in ReadOnlySpace
 - map: 0x387208002955 <Map>
 - length: 0

 - slot #0 BinaryOp BinaryOp:SignedSmall {
     [0]: 1
  }
0x3872082c2281: [Map]
 - type: JS_FUNCTION_TYPE
 - instance size: 32
 - inobject properties: 0
 - elements kind: HOLEY_ELEMENTS
 - unused property fields: 0
 - enum length: invalid
 - stable_map
 - callable
 - constructor
 - has_prototype_slot
 - back pointer: 0x3872080023b5 <undefined>
 - prototype_validity cell: 0x3872082044fd <Cell value= 1>
 - instance descriptors (own) #5: 0x387208283c29 <DescriptorArray[5]>
 - prototype: 0x387208283b79 <JSFunction (sfi = 0x38720820abbd)>
 - constructor: 0x387208283bf5 <JSFunction Function (sfi = 0x38720820acb9)>
 - dependent code: 0x3872080021b9 <Other heap object (WEAK_FIXED_ARRAY_TYPE)>
 - construction counter: 0
```

需要注意的是 V8 会自动监测代码的结构变化，从而执行去优化。例如下述代码：

```javascript
function add(x, y) {
    return x + y
}

%EnsureFeedbackVectorForFunction(add);

add(1, 2); 
%OptimizeFunctionOnNextCall(add);
add(1, 2); 
// 改变 add 函数的传入参数类型，之前都是 number 类型，这里传入 string 类型
add(1, '2'); 
%DebugPrint(add);
```

我们可以通过 --trace-deopt 参数跟踪 add 函数的去优化信息：

```yaml
v8-debug --allow-natives-syntax --trace-deopt  ./index.js

// 执行去优化，reason: not a Smi（Smi 在后续的系列文章中进行讲解，这里说明传入的不是一个小整数类型）
[bailout (kind: deopt-eager, reason: not a Smi: begin. deoptimizing 0x08f70829363d <JSFunction add (sfi = 0x8f7082934c9)>, opt id 0, node id 58, bytecode offset 2, deopt exit 1, FP to SP delta 32, caller SP 0x7ffee9ce7d70, pc 0x08f700044162]
DebugPrint: 0x8f70829363d: [Function] in OldSpace
 - map: 0x08f7082c2281 <Map(HOLEY_ELEMENTS)> [FastProperties]
 - prototype: 0x08f708283b79 <JSFunction (sfi = 0x8f70820abbd)>
 - elements: 0x08f70800222d <FixedArray[0]> [HOLEY_ELEMENTS]
 - function prototype: 
 - initial_map: 
 - shared_info: 0x08f7082934c9 <SharedFunctionInfo add>
 - name: 0x08f708003f09 <String[3]: #add>
 - formal_parameter_count: 2
 - kind: NormalFunction
 - context: 0x08f708283649 <NativeContext[263]>
 - code: 0x08f700044001 <Code TURBOFAN>
 - interpreted
 - bytecode: 0x08f7082936cd <BytecodeArray[6]>
 - source code: (x, y) {
    return x + y
}
 - properties: 0x08f70800222d <FixedArray[0]>
 - All own properties (excluding elements): {
    0x8f708004bb5: [String] in ReadOnlySpace: #length: 0x08f708204431 <AccessorInfo> (const accessor descriptor), location: descriptor
    0x8f708004dfd: [String] in ReadOnlySpace: #name: 0x08f7082043ed <AccessorInfo> (const accessor descriptor), location: descriptor
    0x8f708003fad: [String] in ReadOnlySpace: #arguments: 0x08f708204365 <AccessorInfo> (const accessor descriptor), location: descriptor
    0x8f7080041f1: [String] in ReadOnlySpace: #caller: 0x08f7082043a9 <AccessorInfo> (const accessor descriptor), location: descriptor
    0x8f7080050b1: [String] in ReadOnlySpace: #prototype: 0x08f708204475 <AccessorInfo> (const accessor descriptor), location: descriptor
 }
 - feedback vector: 0x8f708293715: [FeedbackVector] in OldSpace
 - map: 0x08f708002711 <Map>
 - length: 1
 - shared function info: 0x08f7082934c9 <SharedFunctionInfo add>
 - no optimized code
 - optimization marker: OptimizationMarker::kNone
 - optimization tier: OptimizationTier::kNone
 - invocation count: 1
 - profiler ticks: 0
 - closure feedback cell array: 0x8f7080032b5: [ClosureFeedbackCellArray] in ReadOnlySpace
 - map: 0x08f708002955 <Map>
 - length: 0

 - slot #0 BinaryOp BinaryOp:Any {
     [0]: 127
  }
0x8f7082c2281: [Map]
 - type: JS_FUNCTION_TYPE
 - instance size: 32
 - inobject properties: 0
 - elements kind: HOLEY_ELEMENTS
 - unused property fields: 0
 - enum length: invalid
 - stable_map
 - callable
 - constructor
 - has_prototype_slot
 - back pointer: 0x08f7080023b5 <undefined>
 - prototype_validity cell: 0x08f7082044fd <Cell value= 1>
 - instance descriptors (own) #5: 0x08f708283c29 <DescriptorArray[5]>
 - prototype: 0x08f708283b79 <JSFunction (sfi = 0x8f70820abbd)>
 - constructor: 0x08f708283bf5 <JSFunction Function (sfi = 0x8f70820acb9)>
 - dependent code: 0x08f7080021b9 <Other heap object (WEAK_FIXED_ARRAY_TYPE)>
 - construction counter: 0
```

需要注意的是代码在执行 **`去优化`** 的过程中会 **`产生`** 性能损耗，因此在日常的开发中，建议使用 TypeScript 对代码进行类型声明，这样可以一定程度提升代码的性能。
