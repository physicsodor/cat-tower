# 정보형

## Course

### 목적

- Subject의 부모 역할을 하면서도 Subject와 구분되는 type이 필요했습니다.
- Subject가 파일이라면 Course는 폴더의 역할을 합니다.
- Course의 부모는 Course입니다.

### 구성

- Course는 아래의 내용을 담는 type입니다.

1. ttl: 제목(title)

- 그 외에도 Family를 확장합니다.

### 생성

- DefSbj: idx와 mom을 받아 Subject를 만듭니다.

## Family

### 목적

- 항목의 위계질서(부모자식관계)를 표현하기 위해 만들었습니다.

### 구성

- Family은 아래의 내용을 담는 type입니다.

1. idx: 고유번호
2. mom: 부모의 고유번호

- 내용이 수정되고 순서가 바뀌어도 변하지 않는 이름이 필요할 것 같아 고유번호 idx를 만들었습니다.

### 생성

- DefFam: idx와 mom을 받아 Family를 생성합니다.

## Subject

### 목적

- 다양한 내용을 담고 있는 객체를 만들고자 했습니다.
- 초기 목적에 맞게 이름은 "과목"을 의미하는 Subject로 정했습니다.

### 구성

- Subject는 아래의 내용을 담는 type입니다.

1. ttl: 제목(title)
2. cnt: 본문(contents)
3. dsc: 요약(description)

- 그 외에도 Family를 확장합니다.

### 생성

- DefSbj: idx와 mom을 받아 Subject를 만듭니다.

# 상수형

## SelectMode

### 목적

- 어떤 항목을 골랐을 때 그것을 기존의 선택목록에 추가할 것인지, 목록에서 제외할 것인지, 아니면 선택목록을 비우고 새로 만들 것인지를 판단하기 위해 만들었습니다.

### 구성

- SelectMode는 아래의 네 가지 중 하나의 값을 가질 수 있습니다.

1. Add: 기존 선택목록에 추가
2. REMOVE: 기존 선택목록에서 제외
3. REPLACE: 기존 선택목록 초기화 후 새로 선택
4. NONE: 하려던 거 멈추고 가만히 있어!
