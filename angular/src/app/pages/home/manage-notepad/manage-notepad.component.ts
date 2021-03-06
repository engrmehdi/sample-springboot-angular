import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, ViewChildren, Inject } from '@angular/core';
import { Observable, fromEvent, Subject, timer } from 'rxjs'; 
import { CdkDropList, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { User, RegisterUser } from 'src/app/model/user'; 
import { NzMessageService, NzContextMenuService, NzDropdownMenuComponent } from 'ng-zorro-antd';
import { LoginService } from 'src/app/login/login.service'; 
import { Router } from '@angular/router';
import { takeUntil, throttleTime } from 'rxjs/operators'; 
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatTreeNestedDataSource, MatTreeNode } from '@angular/material/tree';
import { NgxSpinnerService } from 'ngx-spinner';
import { MatMenuTrigger } from '@angular/material/menu';
import { Item } from 'src/app/model/item';
import { Menu } from 'src/app/model/menu';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { NoteService } from './note.service';
import { Note2Service } from './note2.service'; 
declare var $ : any;
interface TreeNodeData {
    children:any[];    ​​
    expanded: boolean;    ​​
    key:any;    ​​
    menuId:any;    ​​
    menuName:any;    ​​
    orderId:any;
    ​pId:any;    ​​
    title:any;
    uId:any;    ​​
    userName:any;    ​​
    userType:any;
  }
@Component({
  selector: 'app-manage-notepad',
  templateUrl: './manage-notepad.component.html',
  styleUrls: ['./manage-notepad.component.less']
})

export class ManageNotepadComponent implements OnInit, AfterViewInit, OnDestroy {
  keyEnter: Observable<any> = fromEvent(window, 'keyup.enter');
  activeNode:any; 
  @ViewChildren(MatTreeNode, { read: ElementRef }) treeNodes: ElementRef[];
  submitSubject: Subject<string> = new Subject();
  submitFolder: Subject<string> = new Subject();
  destroy$ = new Subject();
  user: User = new User();
  isSpinning = false;
  fieldContent = '';
  editId = null;
  size = 'small';
  activatedId = null;
  done = []; 
  folderList:any[]=[]; 
  treeMenu:any[]=[]; 
  noteList:any[] = [];
  activeItem: any;
  targetItem: any;
  selectedNode:any;
  backgroundColor:any = 'AliceBlue';
  colors:any = ['AliceBlue','AntiqueWhite','Beige','DarkGrey','DarkSeaGreen','Gainsboro'] 
  dragingItem:any;
  treeControl = new NestedTreeControl<TreeNodeData>(node => node.children);
  dataSource = new MatTreeNestedDataSource<TreeNodeData>(); 
  hasChild = (_: number, node: TreeNodeData) => !!node.children && node.children.length > 0; 
  pId = 0;
  Visible = false;
  isOkLoading = false;
  addFileItem: { menuName: string, pId: number } = {menuName: '', pId: this.pId};

  constructor(private msgService: NzMessageService, 
              private noteService: NoteService,
              private loginService: LoginService,
              private note2Service: Note2Service,
              public dialog: MatDialog,
              public translate: TranslateService,
              private route: Router,public spinner:NgxSpinnerService,
              private nzContextMenuService: NzContextMenuService) { 

  } 
  ngOnInit(): void {
      this.getUser();  
      this.translate.addLangs(['en', 'ch']);
      let dfltLang = localStorage.getItem('lang');
      if(dfltLang != null && dfltLang != ''){
          this.translate.use(dfltLang);
          this.translate.setDefaultLang(dfltLang);
      }else{
          this.translate.use('en');
          this.translate.setDefaultLang('en');
      }
  }
  switchLang(lang: string) {
    this.translate.use(lang);
    localStorage.removeItem('lang');
    localStorage.setItem('lang',lang);
  }
  ngAfterViewInit() {
      this.submitSubject.pipe(
          throttleTime(500),
          takeUntil(this.destroy$)
      ).subscribe(res => {
          const key = this.selectedNode.key;
          this.noteService.addItem({pId: key, content: res})
              .subscribe(
                  res2 => {
                      this.fieldContent = '';
                      this.getItems();
                  }
              );
      });
      this.submitFolder.pipe(
          throttleTime(500),
          takeUntil(this.destroy$)
      ).subscribe(data => { 
          this.note2Service.addFile(data).subscribe(
            res => { 
                this.addFileItem.menuName = '';
                this.addFileItem.pId = null;
                this.isOkLoading = false;
                this.getMenuList();
            }
        );
      });
  } 
  ngOnDestroy(): void {
      this.destroy$.next();
      this.destroy$.complete();
  }
  dragStarted(item: any){
    this.dragingItem = item;
   }
  drop(event: CdkDragDrop<string[]>) { 
    if (event.previousContainer === event.container) { 
        this.dragingItem.zindex = event.currentIndex;
        moveItemInArray(this.noteList, event.previousIndex, event.currentIndex);
        this.updateItemSort(this.dragingItem); 
    } else { 
    }
  }
  dragFolderStarted(menu){ 
  }
  dropTree(event: CdkDragDrop<string[]>) { 
  } 
  dragStartedOld(item: any, i: number, dragEl: HTMLElement) {
      this.noteService.dragSubject.next({item, index: i});
  } 
  startEdit(id: string) {
      this.editId = id;
  } 
  stopEdit(item) {
      this.editId = null;
      this.editItem(item);
  } 
  editItem(item) {
      this.spinner.show();
      this.noteService.editItem({itemId: item.itemId, content: item.content, pId: item.pId})
        .subscribe(
            res => { 
                this.spinner.hide();
                this.editItemData = new Item();
                this.getItems();
         });
  }  
  editFile(data) {
      this.spinner.show();
      this.note2Service.editFile({menuId: data.key, menuName: data.menuName}).subscribe(
          res => { 
             this.editMenuData = new Menu();
             this.spinner.hide();
             this.getMenuList();
          }
      );
  }
  getMenuList(key?: string) {
      this.noteService.getMenus().subscribe(res => { 
          this.isUserAlreadyExist = true;
          this.treeMenu = [];
          this.dataSource = new MatTreeNestedDataSource<TreeNodeData>();
          this.selectedNode = null; 
          if(res){
            this.folderList = res;
            this.makeTreeData(res); 
          } 
      }, (error) => {
        this.spinner.hide(); 
      });
  }
  makeTreeData(menus:any[]){
    this.spinner.show(); 
    menus.forEach(element => { 
        let parent:any = menus.find(item => item.menuId == element.pId && element.pId != 0 && element.pId != null);
        if(parent){
           parent.children = parent.children? parent.children:[];
           parent.children.push(element);
        }            
    }); 
    menus.forEach(element => {
        if(element.pId == 0 || element.pId == null){
            this.treeMenu.push(element)
        }
    });   
    this.dataSource.data = this.treeMenu;
    this.activeNode = this.treeMenu[0];
    this.activatedNodeChange(this.activeNode); 
    this.spinner.hide();
    this.startReloading();
  }
  clearList() {
      this.done = [];
  }
  isUserAlreadyExist:boolean = true;
  isOpenUser:boolean = false;
  getUser() {
      this.spinner.show(); 
      this.noteService.getUser().subscribe((res: any) => {
          if(res && res.userType == "VISITOR"){
            this.isOpenUser = true;
          }else{
            this.isOpenUser = false;
          }
          this.user = res;
          this.spinner.hide(); 
          this.getMenuList();
      }, (error) => {
          this.spinner.hide(); 
          this.isOpenUser = true;
        //   if (error.status === 401) { 
              if (!localStorage.getItem('uuid')) {
                   this.isUserAlreadyExist = false;
                //   this.getUuid();
              } else {
                  this.getMenuList();
              }
        //   }
      });
  }
 startReloading(){
  const source = timer(1000, 10000);
  source.subscribe(val => this.getUpdatedMenus());
 }
 getUpdatedMenus(){ 
  this.noteService.getMenus().subscribe(res => { 
    let newTreeData = [];
    let dataSource = new MatTreeNestedDataSource<TreeNodeData>(); 
    if(res){
      this.folderList = res; 
      res.forEach(element => { 
        let parent:any = res.find(item => item.menuId == element.pId && element.pId != 0 && element.pId != null);
        if(parent){
           parent.children = parent.children? parent.children:[];
           parent.children.push(element);
        }            
    }); 
    res.forEach(element => {
        if(element.pId == 0 || element.pId == null){
          newTreeData.push(element)
        }
    });   
    if(newTreeData.length != this.treeMenu.length){
      this.treeMenu = newTreeData;
      dataSource.data = newTreeData; 
      this.dataSource = new MatTreeNestedDataSource<TreeNodeData>();
      this.dataSource = dataSource; 
      this.activeNode = this.treeMenu[0];
      this.activatedNodeChange(this.activeNode);  
    }
    } 
    }, (error) => {
      this.spinner.hide(); 
    });
  }
  getUuid() { 
    this.spinner.show();
      this.noteService.getUuid().subscribe((res: string) => {  
        this.spinner.hide();
          this.noteService.uuidSubject.next(res);
          localStorage.setItem('uuid', res); 
          this.handleOk();
      },(error) => {
        this.spinner.hide(); 
        console.log(error); 
    });
  }  
  // 退出
  logout() {
     if(this.isOpenUser){ 
        if(confirm("Your Data Will Loss")) {
            this.route.navigateByUrl('login');
            localStorage.removeItem('uuid');
            sessionStorage.removeItem('token');
        } 
      }else{ 
        this.route.navigateByUrl('login');
        localStorage.removeItem('uuid');
        sessionStorage.removeItem('token');
      }
  } 
  // 活动节点变动
  activatedNodeChange(activeNode) {
      this.selectedNode = activeNode; 
      this.getItems();
  } 
  submit() {
        if(this.selectedNode) {  
            if(this.fieldContent !== null && this.fieldContent != ''){
              let item = {itemId:this.noteList.length+1,content:this.fieldContent} 
              this.noteList.push(item); 
              this.msgService.success(this.getTranslationString('notepad.addedSuccess',''));
              this.submitSubject.next(this.fieldContent);
              this.fieldContent = '';
            }  
        }else { 
            this.msgService.warning(this.getTranslationString('notepad.selectFolder',''));
        } 
  
  } 
  getItems() {
    if(this.selectedNode && this.selectedNode.menuId) { 
      const key = this.selectedNode.menuId; 
      this.noteService.getItems({pId: key}).subscribe(
          (res: Item[]) => {  
              this.noteList = res; 
          },(error) => { 
            console.log(error); 
        });
   }
  }  
  updateItemSort(tmpnode) { 
    this.noteService.updateItemSort_gen(tmpnode).subscribe(
        res => { 
               this.getItems(); 
            },(error) => { 
    }); 
  } 
  copy(item) { 
  } 
  cut(item) { 
  } 
  paste(item) { 
  } 
  setMoveItem() { 
  } 
//===================add edit delete folder=================
    showModal(): void {
        this.Visible = true;
    }
    checkUsetExist(){
        this.Visible = false;
        if(this.isUserAlreadyExist){
            this.handleOk();
        }else{ 
            if (!localStorage.getItem('uuid')) {
                this.getUuid();
            } 
        }
    }
    handleOk(): void {
      let copy = JSON.parse(JSON.stringify(this.addFileItem))  
      this.treeMenu = [];
      this.folderList.push(copy);     
      this.makeTreeData(this.folderList);
      this.addFileItem.menuName = '';
      this.addFileItem.pId = null;
      this.msgService.success(this.getTranslationString('notepad.addedSuccess','')); 
      this.submitFolder.next(copy); 
    }
    handleCancel(): void {
        this.Visible = false;
    } 
    add(e, key) {
        e.stopPropagation();
        this.addFileItem.pId = this.pId = key;
        this.addFile();
    } 
    addFile() {
        this.showModal();
    } 
    addFootFile() {
        this.addFileItem.pId = null;
        this.showModal(); 
    } 
    // cut,copy and paste right click menus
    isRecCopyCut:boolean = false;
    recForCopyCut:any;
    recTypeForCopyCut:any;
    @ViewChild(MatMenuTrigger) 
    contextMenu: MatMenuTrigger;
  
    contextMenuPosition = { x: '0px', y: '0px' };
  
    onContextMenu(event: MouseEvent, item: any,recType:any) {
      event.preventDefault();
      this.contextMenuPosition.x = event.clientX + 'px';
      this.contextMenuPosition.y = event.clientY + 'px';
      this.contextMenu.menuData = { 'item': item,'recType': recType };
      this.contextMenu.menu.focusFirstItem('mouse');
      this.contextMenu.openMenu();
    } 
    onContextMenuAction(item: any,recType,action) {
      if(action == 'create_new_folder'){  
         this.addFileItem.pId = this.pId = item.key;
         this.addFile(); 
      }
      if(action == 'copy'){
        this.isRecCopyCut = true; 
        this.recForCopyCut = item; 
        this.recTypeForCopyCut = recType;
      }
      if(action == 'cut'){
        this.isRecCopyCut = false;
        this.recForCopyCut = item; 
        this.recTypeForCopyCut = recType;
      }
      if(action == 'paste'){
          if(recType == 'note' && recType == this.recTypeForCopyCut){
              return;
          }
          this.pasteMenuOrNote(item);
      }
      if(action == 'edit'){
        this.openEdotDialog(item,recType);
      }
      if(action == 'delete'){
        if(confirm("Are you sure to delete this record")) {
            this.deleteMenuOrNote(item,recType);
        }
      }
    } 
    pasteMenuOrNote(targetItem){ 
     if(this.recTypeForCopyCut == 'menu'){
        if(this.isRecCopyCut){
           this.copyMenuToMenu(targetItem,this.recForCopyCut);
        }else{
           this.cutMenuToMenu(targetItem,this.recForCopyCut);
        }
     }else{ 
        if(this.isRecCopyCut){
           this.copyItemToMenu(targetItem,this.recForCopyCut);
         }else{
           this.cutItemToMenu(targetItem,this.recForCopyCut);
         }
     }
    } 
    copyMenuToMenu(targetItem,recForCopyCut){
        let menu:Menu = new Menu();
        menu.menuName = 'copy of:'+recForCopyCut.menuName; 
        menu.pId = targetItem.menuId?targetItem.menuId:0; 
        this.spinner.show();
        this.note2Service.addFile(menu).subscribe(
            res => {
                this.spinner.show(); 
                this.getMenuList();
            }
        ); 
    } 
    cutMenuToMenu(targetItem,recForCopyCut){ 
        let menu:Menu = new Menu();
        menu.menuId = recForCopyCut.menuId;
        menu.orderId = recForCopyCut.orderId;
        menu.pId = targetItem.menuId; 
        this.spinner.show();
        this.note2Service.updateMenuSort_gen(menu).subscribe(res => { 
             this.spinner.hide();
             this.getMenuList();
        });
    } 
    copyItemToMenu(targetItem,recForCopyCut){   
          this.spinner.show();
          this.noteService.addItem({pId: targetItem.menuId, content: 'copy of: '+recForCopyCut.content})
            .subscribe(
                res => { 
                   this.spinner.hide(); 
                   this.getItems();
            });
    } 
    cutItemToMenu(targetItem,recForCopyCut){
        let item:Item = new Item();
        item.itemId = recForCopyCut.itemId;
        item.content = recForCopyCut.content; 
        item.pId = targetItem.menuId; 
        this.spinner.show();
        this.noteService.editItem(item).subscribe(res => { 
             this.spinner.hide();
             this.getItems();
        });
    }
    deleteMenuOrNote(targetItem,recType){
      if(recType == 'menu'){
        this.deleteNode(targetItem.key)
      }else{
        this.deleteItem(targetItem);
      }
    }  
    editMenuData:Menu = new Menu();
    editItemData:Item = new Item();
    editItemVisible:boolean = false;
    editMenuVisible:boolean = false; 
    openEdotDialog(record,type): void {
        if(type=='menu'){
            this.editMenuData = Object.assign({}, record);
            this.editMenuVisible = true;
        }else{
            this.editItemData = Object.assign({}, record);
            this.editItemVisible = true;
        } 
    }
    saveMenuRecord(){  
        this.editItemVisible = false;
        this.editMenuVisible = false;
        this.editFile(this.editMenuData);
    }
    saveItemRecord(){  
        this.editItemVisible = false;
        this.editMenuVisible = false;
        this.editItem(this.editItemData);
    }
    deleteItem(item) {
     this.spinner.show();
     this.noteService.delItem(item.itemId).subscribe(
        res => {
            this.spinner.hide();
            this.getItems();
        });
    }
    deleteNode(key) { 
        this.spinner.show(); 
        this.note2Service.delFile(key).subscribe(
            res => { 
                this.spinner.hide();
                this.getMenuList();
                this.msgService.success(this.getTranslationString('notepad.noteDelete',''));
            }, error => {
                this.spinner.hide();
                this.msgService.warning(this.getTranslationString('notepad.noteDeleteFail',''));
                this.getMenuList();
            }
        );
    }
    getTranslationString(key:string, params:Object):string {
        let str:string;
        this.translate.get(key, params).subscribe((res: string) => { 
          str = res;
        });
        return str;
    } 
} 